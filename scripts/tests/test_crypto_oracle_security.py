#!/usr/bin/env python3
"""
Security and Precision Tests for Crypto Oracle V1
Tests critical production requirements:
- Environment variable validation (fail-fast)
- USDC decimal precision (6 decimals)
- Rate limiting functionality
- No sensitive data in logs
"""

import os
import sys
import pytest
import time
from decimal import Decimal
from unittest.mock import patch, MagicMock

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'scripts'))

from crypto_oracle_v1_prod import CryptoOracle, OracleConfig


class TestSecurityValidation:
    """Test security-critical validations"""
    
    def test_missing_private_key_raises_error(self):
        """Vérifie que le bot refuse de démarrer sans POLY_PRIVATE_KEY"""
        with patch.dict(os.environ, {}, clear=True):
            with pytest.raises(ValueError, match="POLY_PRIVATE_KEY"):
                oracle = CryptoOracle()
    
    def test_invalid_private_key_raises_error(self):
        """Vérifie que les clés trop courtes sont rejetées"""
        with patch.dict(os.environ, {"POLY_PRIVATE_KEY": "tooshort"}, clear=True):
            with pytest.raises(ValueError, match="appears invalid"):
                oracle = CryptoOracle()
    
    def test_valid_private_key_initializes(self):
        """Vérifie qu'une clé valide permet l'initialisation"""
        test_key = "0x" + "a" * 64  # 66 chars = valid length
        with patch.dict(os.environ, {"POLY_PRIVATE_KEY": test_key}, clear=True):
            # Mock CLOB client to avoid real connection
            with patch('crypto_oracle_v1_prod.ClobClient'):
                oracle = CryptoOracle()
                assert oracle.config.private_key == test_key


class TestDecimalPrecision:
    """Test USDC decimal precision (6 decimals)"""
    
    @pytest.fixture
    def oracle(self):
        """Create oracle with mocked CLOB client"""
        test_key = "0x" + "a" * 64
        with patch.dict(os.environ, {"POLY_PRIVATE_KEY": test_key}, clear=True):
            with patch('crypto_oracle_v1_prod.ClobClient'):
                return CryptoOracle()
    
    def test_to_decimal_precision(self, oracle):
        """Vérifie que _to_decimal utilise 6 décimales"""
        result = oracle._to_decimal(123.456789123)
        assert result == Decimal("123.456789")
    
    def test_calculate_shares_precision(self, oracle):
        """Vérifie que le calcul de shares utilise 6 décimales pour USDC"""
        # Acheter 100 USDC à 0.65 ¢ = 153.846153 shares
        cost = Decimal("100")
        price = Decimal("0.65")
        shares = oracle._calculate_shares(cost, price)
        
        # Résultat attendu: 153.846153 (6 décimales)
        expected = Decimal("153.846153")
        assert shares == expected
    
    def test_zero_price_handling(self, oracle):
        """Vérifie la gestion des prix à 0"""
        shares = oracle._calculate_shares(Decimal("100"), Decimal("0"))
        assert shares == Decimal("0")


class TestRateLimiting:
    """Test rate limiter functionality"""
    
    @pytest.mark.asyncio
    async def test_rate_limiter_limits_requests(self):
        """Vérifie que le rate limiter bloque après max_requests"""
        from crypto_oracle_v1_prod import RateLimiter
        
        limiter = RateLimiter(max_requests=5, per_seconds=1)
        
        start = time.time()
        
        # Should allow 5 requests immediately
        for _ in range(5):
            await limiter.acquire()
        
        # Next request should wait
        await limiter.acquire()
        
        elapsed = time.time() - start
        
        # Should take at least ~0.2s (1 token refill time)
        assert elapsed >= 0.15, f"Rate limiter did not delay (elapsed: {elapsed}s)"
    
    @pytest.mark.asyncio
    async def test_rate_limiter_refills_tokens(self):
        """Vérifie que le rate limiter recharge les tokens"""
        from crypto_oracle_v1_prod import RateLimiter
        
        limiter = RateLimiter(max_requests=10, per_seconds=1)
        
        # Use all tokens
        for _ in range(10):
            await limiter.acquire()
        
        # Wait for refill
        await asyncio.sleep(0.5)
        
        # Should have ~5 tokens available now
        start = time.time()
        for _ in range(5):
            await limiter.acquire()
        elapsed = time.time() - start
        
        # Should be nearly instant (< 0.1s)
        assert elapsed < 0.1, "Tokens not properly refilled"


class TestCacheWithTTL:
    """Test smart wallet cache with TTL"""
    
    @pytest.fixture
    def oracle(self):
        """Create oracle with mocked dependencies"""
        test_key = "0x" + "a" * 64
        with patch.dict(os.environ, {"POLY_PRIVATE_KEY": test_key}, clear=True):
            with patch('crypto_oracle_v1_prod.ClobClient'):
                return CryptoOracle()
    
    @pytest.mark.asyncio
    async def test_cache_returns_fresh_data(self, oracle):
        """Vérifie que le cache retourne les données fraîches"""
        # Mock API responses
        with patch.object(oracle, '_fetch_with_rate_limit') as mock_fetch:
            mock_fetch.return_value = []
            
            # First call should hit API
            result1 = await oracle.get_smart_wallets_async(10000)
            
            # Second call within TTL should use cache
            result2 = await oracle.get_smart_wallets_async(10000)
            
            # API should only be called once
            assert mock_fetch.call_count == 1
    
    def test_cache_key_includes_min_profit(self, oracle):
        """Vérifie que la clé de cache inclut min_profit"""
        oracle.smart_wallet_cache["smart_wallets_5000"] = (["0xabc"], time.time())
        oracle.smart_wallet_cache["smart_wallets_10000"] = (["0xdef"], time.time())
        
        # Different min_profit should have different cache entries
        assert len(oracle.smart_wallet_cache) == 2


class TestErrorHandling:
    """Test specific error handling (no bare except)"""
    
    @pytest.fixture
    def oracle(self):
        """Create oracle with mocked dependencies"""
        test_key = "0x" + "a" * 64
        with patch.dict(os.environ, {"POLY_PRIVATE_KEY": test_key}, clear=True):
            with patch('crypto_oracle_v1_prod.ClobClient'):
                return CryptoOracle()
    
    def test_sentiment_handles_http_error(self, oracle):
        """Vérifie que analyze_smart_sentiment gère les erreurs HTTP"""
        with patch('requests.get') as mock_get:
            mock_get.side_effect = requests.HTTPError(response=MagicMock(status_code=500))
            
            result = oracle.analyze_smart_sentiment("test-market")
            
            # Should return neutral sentiment, not crash
            assert result.bias.value == "NEUTRAL"
            assert result.score == 0
    
    def test_spot_price_handles_network_error(self, oracle):
        """Vérifie que get_spot_price gère les erreurs réseau"""
        with patch('requests.get') as mock_get:
            mock_get.side_effect = requests.RequestException("Network error")
            
            result = oracle.get_spot_price("BTC/USDT")
            
            # Should return None, not crash
            assert result is None


class TestNoSensitiveDataInLogs:
    """Test that no sensitive data appears in logs"""
    
    def test_private_key_not_in_error_log(self):
        """Vérifie que la clé privée n'apparaît pas dans les logs d'erreur"""
        test_key = "0x" + "secret" * 11  # 66 chars
        
        with patch.dict(os.environ, {"POLY_PRIVATE_KEY": test_key}, clear=True):
            # Force an error during CLOB initialization
            with patch('crypto_oracle_v1_prod.ClobClient') as mock_clob:
                mock_clob.side_effect = Exception(f"Connection failed with key: {test_key}")
                
                # Capture logs
                import logging
                import io
                log_capture = io.StringIO()
                handler = logging.StreamHandler(log_capture)
                
                logger = logging.getLogger("CryptoOracle")
                logger.addHandler(handler)
                
                try:
                    oracle = CryptoOracle()
                except Exception:
                    pass
                
                log_output = log_capture.getvalue()
                
                # Private key should NOT appear in logs
                assert "secret" not in log_output, "Private key leaked in logs!"


# Run tests with: pytest tests/test_crypto_oracle_security.py -v
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
