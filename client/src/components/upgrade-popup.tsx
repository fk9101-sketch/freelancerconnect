import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UpgradePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradePopup({ isOpen, onClose }: UpgradePopupProps) {
  const [, setLocation] = useLocation();

  const handleUpgrade = () => {
    onClose();
    setLocation('/subscription-plans');
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold text-center">
            <i className="fas fa-crown text-yellow-500 mr-2"></i>
            Upgrade to Paid Plan
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-gray-600">
            To accept this lead and get customer details, you need to upgrade to our Lead Plan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0">
          <AlertDialogCancel className="w-full sm:w-auto">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleUpgrade}
            className="w-full sm:w-auto bg-gradient-purple text-white hover:opacity-90"
          >
            <i className="fas fa-arrow-up mr-2"></i>
            Upgrade Now
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
