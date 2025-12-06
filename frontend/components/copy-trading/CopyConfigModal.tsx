"use client";

import React, { useState } from "react";
import { Settings2, ShieldAlert, Wallet, AlertTriangle, Save } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface CopyConfigModalProps {
    targetWallet?: string; // Optional, if editing existing
    onSave: (config: any) => Promise<void>;
    trigger?: React.ReactNode;
}

export function CopyConfigModal({ targetWallet, onSave, trigger }: CopyConfigModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [wallet, setWallet] = useState(targetWallet || "");
    const [amount, setAmount] = useState<number>(50);
    const [slippage, setSlippage] = useState<number>(1.0);
    const [isInverse, setIsInverse] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await onSave({
                target_wallet: wallet,
                fixed_amount: amount,
                max_slippage: slippage,
                is_inverse: isInverse,
                is_active: true
            });
            setIsOpen(false);
        } catch (error) {
            console.error("Failed to save strategy", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline"><Settings2 className="w-4 h-4 mr-2" /> New Strategy</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-xl border-border/50">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-primary" />
                        Configure Copy Strategy
                    </DialogTitle>
                    <DialogDescription>
                        Automated mirroring of target wallet activities.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">

                    {/* Target Wallet */}
                    <div className="space-y-2">
                        <Label>Target Wallet Address</Label>
                        <Input
                            placeholder="0x..."
                            value={wallet}
                            onChange={(e) => setWallet(e.target.value)}
                            disabled={!!targetWallet} // Disable if editing existing
                            className="font-mono text-xs"
                        />
                    </div>

                    {/* Amount */}
                    <div className="space-y-2">
                        <Label>Bet Amount per Trade ($)</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                            <Input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                className="pl-7"
                            />
                        </div>
                    </div>

                    {/* Slippage */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4 text-orange-500" />
                                Slippage Protection
                            </Label>
                            <span className="text-xs font-mono bg-secondary px-2 py-1 rounded">{slippage}%</span>
                        </div>
                        <Slider
                            defaultValue={[1]}
                            max={10}
                            step={0.5}
                            value={[slippage]}
                            onValueChange={(vals) => setSlippage(vals[0])}
                        />
                        <p className="text-xs text-muted-foreground">
                            If price moves more than {slippage}% against you before execution, the trade is cancelled.
                        </p>
                    </div>

                    {/* Inverse Mode */}
                    <div className="grid grid-cols-1 gap-4 p-4 border border-border/50 rounded-lg bg-secondary/20">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Inverse Copying</Label>
                                <p className="text-xs text-muted-foreground">Bet the OPPOSITE of this trader.</p>
                            </div>
                            <Switch
                                checked={isInverse}
                                onCheckedChange={setIsInverse}
                                className="data-[state=checked]:bg-red-600"
                            />
                        </div>
                        {isInverse && (
                            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/30 p-2 rounded border border-red-900/50">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Warning: You will buy 'NO' when they buy 'YES'.</span>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isLoading} className="bg-primary hover:bg-primary/90 gap-2">
                        {isLoading ? "Saving..." : <><Save className="w-4 h-4" /> Save Strategy</>}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
