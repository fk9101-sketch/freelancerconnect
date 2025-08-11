import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { setupRecaptcha, sendOTP, verifyOTP } from "@/lib/firebase";
import type { ConfirmationResult } from "firebase/auth";

export default function PhoneAuth() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Initialize reCAPTCHA
    if (typeof window !== 'undefined') {
      const recaptcha = setupRecaptcha('recaptcha-container');
      (window as any).recaptchaVerifier = recaptcha;
    }
  }, []);

  const handleSendOTP = async () => {
    if (!phoneNumber) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const recaptcha = (window as any).recaptchaVerifier;
      const confirmation = await sendOTP(phoneNumber, recaptcha);
      setConfirmationResult(confirmation);
      setStep("otp");
      toast({
        title: "OTP Sent",
        description: "Please check your phone for the verification code",
      });
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      toast({
        title: "Failed to Send OTP",
        description: error.message || "Please try again",
        variant: "destructive",
      });
      // Reset reCAPTCHA if needed
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        const recaptcha = setupRecaptcha('recaptcha-container');
        (window as any).recaptchaVerifier = recaptcha;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit verification code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const user = await verifyOTP(confirmationResult, otp);
      console.log("User signed in with phone:", user);
      toast({
        title: "Welcome!",
        description: "Successfully signed in with phone number",
      });
      setLocation('/');
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      toast({
        title: "Invalid OTP",
        description: "Please check the code and try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    if (step === "otp") {
      setStep("phone");
      setOtp("");
    } else {
      setLocation('/');
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Add Indian country code if not present
    if (digits.length > 0 && !digits.startsWith('91')) {
      return '+91' + digits;
    } else if (digits.startsWith('91')) {
      return '+' + digits;
    }
    return '+91';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Status Bar */}
      <div className="status-bar">
        <span>9:41 AM</span>
        <div className="flex space-x-1">
          <i className="fas fa-signal"></i>
          <i className="fas fa-wifi"></i>
          <i className="fas fa-battery-three-quarters"></i>
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-purple text-white p-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={goBack}
            className="text-white hover:bg-white/20 p-2"
            data-testid="button-back"
          >
            <i className="fas fa-arrow-left"></i>
          </Button>
          <h1 className="text-xl font-semibold">Phone Authentication</h1>
        </div>
      </div>

      <div className="p-6">
        <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <CardContent className="p-6">
            {step === "phone" ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-mobile-alt text-blue-600 text-2xl"></i>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">Enter Phone Number</h2>
                  <p className="text-gray-600 text-sm">We'll send you a verification code</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <Input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                      className="w-full text-lg"
                      data-testid="input-phone-number"
                    />
                  </div>

                  <Button
                    onClick={handleSendOTP}
                    disabled={isLoading || !phoneNumber}
                    className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-xl font-medium"
                    data-testid="button-send-otp"
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Sending...</span>
                      </div>
                    ) : (
                      "Send Verification Code"
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-shield-alt text-green-600 text-2xl"></i>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">Enter Verification Code</h2>
                  <p className="text-gray-600 text-sm">
                    We sent a 6-digit code to<br />
                    <span className="font-medium">{phoneNumber}</span>
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Verification Code
                    </label>
                    <Input
                      type="text"
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full text-lg text-center tracking-widest"
                      maxLength={6}
                      data-testid="input-otp"
                    />
                  </div>

                  <Button
                    onClick={handleVerifyOTP}
                    disabled={isLoading || otp.length < 6}
                    className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-xl font-medium"
                    data-testid="button-verify-otp"
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Verifying...</span>
                      </div>
                    ) : (
                      "Verify Code"
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setStep("phone")}
                    className="w-full"
                    data-testid="button-change-number"
                  >
                    Change Phone Number
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {step === "phone" && (
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        )}
      </div>

      {/* reCAPTCHA container */}
      <div id="recaptcha-container"></div>
    </div>
  );
}