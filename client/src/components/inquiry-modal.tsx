import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AreaAutoSuggest } from "@/components/AreaAutoSuggest";
import type { FreelancerWithRelations } from "@shared/schema";

// Form schema for inquiry
const inquirySchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  requirement: z.string().min(10, "Requirement must be at least 10 characters"),
  mobileNumber: z.string().min(10, "Mobile number must be at least 10 digits"),
  budget: z.string().optional(),
  area: z.string().optional(),
});

type InquiryForm = z.infer<typeof inquirySchema>;

interface InquiryModalProps {
  freelancer: FreelancerWithRelations;
  children: React.ReactNode;
}

export default function InquiryModal({ freelancer, children }: InquiryModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user: firebaseUser } = useFirebaseAuth();
  const { userProfile } = useUserProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InquiryForm>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      customerName: userProfile?.firstName && userProfile?.lastName 
        ? `${userProfile.firstName} ${userProfile.lastName}`.trim() 
        : "",
      requirement: "",
      mobileNumber: userProfile?.phone || "",
      budget: "",
      area: userProfile?.area || "",
    },
  });

  const createInquiryMutation = useMutation({
    mutationFn: async (data: InquiryForm) => {
      try {
        console.log('Sending inquiry data:', { ...data, freelancerId: freelancer.id });
        
        const response = await apiRequest('POST', '/api/customer/inquiries', {
          ...data,
          freelancerId: freelancer.id,
        });
        
        console.log('Inquiry response status:', response.status);
        console.log('Inquiry response ok:', response.ok);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Inquiry error response:', errorText);
          throw new Error(`Failed to send inquiry: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Inquiry success result:', result);
        return result;
      } catch (error) {
        console.error('Inquiry mutation error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Inquiry sent successfully!",
        description: `Your inquiry has been sent to ${freelancer.fullName}`,
      });
      setIsOpen(false);
      form.reset();
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/freelancer/inquiries'] });
    },
    onError: (error: Error) => {
      console.error('Inquiry submission error:', error);
      toast({
        title: "Failed to send inquiry",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InquiryForm) => {
    console.log('Form submitted with data:', data);
    createInquiryMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto z-[9999]">
        <DialogHeader className="sticky top-0 bg-background pb-4 border-b">
          <DialogTitle className="text-xl font-semibold">
            Send Inquiry to {freelancer.fullName}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requirement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requirement *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your requirement in detail..."
                      className="min-h-[100px] resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mobileNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your mobile number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., ₹5000, ₹10000-15000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Area (Optional)</FormLabel>
                  <FormControl>
                    <AreaAutoSuggest
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Enter your area/location"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-4 sticky bottom-0 bg-background border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createInquiryMutation.isPending}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {createInquiryMutation.isPending ? "Sending..." : "Send Inquiry"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
