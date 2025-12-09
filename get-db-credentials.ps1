# Script pour récupérer automatiquement les identifiants PostgreSQL du VPS
# et les ajouter comme secret GitHub

Write-Host "🔍 Récupération des identifiants PostgreSQL depuis le VPS..." -ForegroundColor Cyan

# 1. Récupérer les infos de connexion SSH depuis les secrets GitHub (si possible)
Write-Host "`n📋 Entre les informations de connexion SSH à ton VPS:" -ForegroundColor Yellow
$SSH_HOST = Read-Host "Host/IP du VPS"
$SSH_USER = Read-Host "Username SSH"
$SSH_PORT = Read-Host "Port SSH (défaut: 22)"

if ([string]::IsNullOrWhiteSpace($SSH_PORT)) {
    $SSH_PORT = "22"
}

Write-Host "`n🔐 Connexion au VPS pour récupérer les infos PostgreSQL..." -ForegroundColor Cyan

# Script à exécuter sur le VPS pour récupérer les infos PostgreSQL
$REMOTE_SCRIPT = @'
#!/bin/bash
set -e

echo "===DB_INFO_START==="

# Chercher le fichier .env s'il existe
if [ -f ~/PolygraalX/.env ]; then
    echo "ENV_FILE_FOUND=true"
    grep "DATABASE_URL" ~/PolygraalX/.env 2>/dev/null || echo "NO_DATABASE_URL_IN_ENV"
fi

# Essayer de récupérer les infos PostgreSQL du système
if command -v psql &> /dev/null; then
    echo "POSTGRES_INSTALLED=true"
    
    # Lister les bases de données
    sudo -u postgres psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -v "^$" | grep -v "template" | grep -v "postgres" | head -5 || echo "NO_DB_LIST"
fi

# Vérifier si PostgreSQL est en cours d'exécution
if systemctl is-active --quiet postgresql 2>/dev/null; then
    echo "POSTGRES_RUNNING=true"
elif systemctl is-active --quiet postgresql@* 2>/dev/null; then
    echo "POSTGRES_RUNNING=true"
else
    echo "POSTGRES_RUNNING=false"
fi

# Afficher les variables d'environnement qui pourraient contenir DATABASE_URL
env | grep -i "database" || echo "NO_ENV_DATABASE"

echo "===DB_INFO_END==="
'@

# Exécuter le script sur le VPS
try {
    Write-Host "📡 Connexion SSH à ${SSH_USER}@${SSH_HOST}:${SSH_PORT}..." -ForegroundColor Gray
    
    $result = $REMOTE_SCRIPT | ssh -p $SSH_PORT "${SSH_USER}@${SSH_HOST}" "bash -s"
    
    Write-Host "`n✅ Informations récupérées:" -ForegroundColor Green
    Write-Host $result
    
    # Parser les résultats
    if ($result -match "DATABASE_URL=(.+)") {
        $DATABASE_URL = $matches[1].Trim()
        Write-Host "`n🎯 DATABASE_URL trouvé dans .env: $DATABASE_URL" -ForegroundColor Green
        
        $confirm = Read-Host "`nVeux-tu utiliser cette URL? (o/n)"
        if ($confirm -eq "o" -or $confirm -eq "O") {
            Write-Host "`n📤 Ajout du secret GitHub..." -ForegroundColor Cyan
            gh secret set DATABASE_URL --repo ExiZfr/PolygraalX --body "$DATABASE_URL"
            Write-Host "✅ Secret DATABASE_URL ajouté avec succès!" -ForegroundColor Green
            Write-Host "`n🚀 Le déploiement devrait maintenant fonctionner!" -ForegroundColor Cyan
            exit 0
        }
    }
    
    # Si pas trouvé automatiquement, demander manuellement
    Write-Host "`n⚠️ DATABASE_URL non trouvé automatiquement." -ForegroundColor Yellow
    Write-Host "`n📝 Entre les informations manuellement:" -ForegroundColor Cyan
    
    $DB_USER = Read-Host "Nom d'utilisateur PostgreSQL (ex: polygraal_user)"
    $DB_PASSWORD = Read-Host "Mot de passe PostgreSQL" -AsSecureString
    $DB_PASSWORD_Plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASSWORD))
    $DB_HOST = Read-Host "Host de la DB (défaut: localhost)"
    $DB_PORT = Read-Host "Port PostgreSQL (défaut: 5432)"
    $DB_NAME = Read-Host "Nom de la base de données (ex: polygraalx)"
    
    if ([string]::IsNullOrWhiteSpace($DB_HOST)) { $DB_HOST = "localhost" }
    if ([string]::IsNullOrWhiteSpace($DB_PORT)) { $DB_PORT = "5432" }
    
    # Construire la connection string
    $DATABASE_URL = "postgresql://${DB_USER}:${DB_PASSWORD_Plain}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
    
    Write-Host "`n🔗 Connection string générée:" -ForegroundColor Cyan
    Write-Host $DATABASE_URL -ForegroundColor Gray
    
    $confirm = Read-Host "`nAjouter ce secret à GitHub? (o/n)"
    if ($confirm -eq "o" -or $confirm -eq "O") {
        Write-Host "`n📤 Ajout du secret GitHub..." -ForegroundColor Cyan
        gh secret set DATABASE_URL --repo ExiZfr/PolygraalX --body "$DATABASE_URL"
        Write-Host "✅ Secret DATABASE_URL ajouté avec succès!" -ForegroundColor Green
        Write-Host "`n🚀 Le déploiement devrait maintenant fonctionner!" -ForegroundColor Cyan
    }
    
} catch {
    Write-Host "`n❌ Erreur lors de la connexion SSH:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "`n💡 Assure-toi que:" -ForegroundColor Yellow
    Write-Host "  - Tu peux te connecter au VPS via SSH normalement" -ForegroundColor Yellow
    Write-Host "  - La clé SSH est bien configurée" -ForegroundColor Yellow
    
    Write-Host "`n📝 Tu peux aussi ajouter le secret manuellement:" -ForegroundColor Cyan
    Write-Host 'https://github.com/ExiZfr/PolygraalX/settings/secrets/actions/new' -ForegroundColor Blue
}
