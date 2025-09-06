import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertLeadSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Category } from "@shared/schema";

const jobPostingSchema = insertLeadSchema.omit({
  customerId: true, // We'll add this programmatically from the current user
}).extend({
  budgetMin: z.coerce.number().min(1, "Minimum budget is required"),
  budgetMax: z.coerce.number().min(1, "Maximum budget is required"),
  mobileNumber: z.string()
    .min(1, "Mobile number is required")
    .regex(/^\+91[0-9]{10}$/, "Please enter a valid 10-digit mobile number"),
}).refine((data) => data.budgetMax >= data.budgetMin, {
  message: "Maximum budget must be greater than or equal to minimum budget",
  path: ["budgetMax"],
});

type JobPostingForm = z.infer<typeof jobPostingSchema>;

export default function JobPosting() {
  const { isAuthenticated, isLoading, user } = useFirebaseAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentLocation, setCurrentLocation] = useState<string>("");

  // Get query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const preSelectedCategory = urlParams.get('category');

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/');
      return;
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    retry: false,
  });

  // Form setup
  const form = useForm<JobPostingForm>({
    resolver: zodResolver(jobPostingSchema),
    defaultValues: {
      title: "",
      description: "",
      budgetMin: 0,
      budgetMax: 0,
      location: "",
      mobileNumber: "+91",
      pincode: "",
      preferredTime: "",
      categoryId: preSelectedCategory || "",
      photos: [],
    },
  });

  // Create lead mutation
  const createLeadMutation = useMutation({
    mutationFn: async (data: JobPostingForm) => {
      await apiRequest('POST', '/api/customer/leads', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job posted successfully! Freelancers will be notified.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/customer/leads'] });
      setLocation('/customer');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post job",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: JobPostingForm) => {
    console.log('Form submission data:', data);
    console.log('Form errors:', form.formState.errors);
    console.log('Current user:', user);
    
    // Check if user is available
    if (!user || !user.uid) {
      toast({
        title: "Authentication Error",
        description: "Please log in to post a job",
        variant: "destructive",
      });
      return;
    }
    
    // Add customerId to the data
    const submitData = {
      ...data,
      customerId: user.uid
    };
    
    console.log('Final submission data with customerId:', submitData);
    createLeadMutation.mutate(submitData);
  };

  const handleGoBack = () => {
    setLocation('/customer');
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In a real app, you'd reverse geocode these coordinates
          const location = `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
          setCurrentLocation(location);
          form.setValue("location", location);
          toast({
            title: "Location Updated",
            description: "Current location has been set",
          });
        },
        (error) => {
          toast({
            title: "Location Error",
            description: "Unable to get your current location",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Location Not Supported",
        description: "Geolocation is not supported by this browser",
        variant: "destructive",
      });
    }
  };

  if (isLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {/* Header */}
      <div className="bg-gradient-purple text-white p-6 flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGoBack}
          className="mr-4 text-white hover:bg-white/15 p-3 rounded-2xl backdrop-blur-sm"
          data-testid="button-go-back"
        >
          <i className="fas fa-arrow-left text-lg"></i>
        </Button>
        <h2 className="text-xl font-bold">Post Your Requirement</h2>
      </div>

      {/* Form Content */}
      <div className="p-6 pb-32 bg-background">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Category Selection */}
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block text-sm font-semibold text-foreground mb-2">
                    Service Category
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger 
                        className="w-full bg-card border border-border rounded-2xl px-4 py-4 text-card-foreground focus:border-primary focus:ring-primary shadow-sm"
                        data-testid="select-category"
                      >
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Job Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block text-sm font-semibold text-foreground mb-2">
                    Job Title
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Fix ceiling fan"
                      className="w-full bg-card border border-border rounded-2xl px-4 py-4 text-card-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary shadow-sm"
                      data-testid="input-job-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block text-sm font-semibold text-foreground mb-2">
                    Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      placeholder="Describe your requirements in detail..."
                      className="w-full bg-card border border-border rounded-2xl px-4 py-4 text-card-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary shadow-sm"
                      data-testid="textarea-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Budget Range */}
            <div>
              <FormLabel className="block text-sm font-semibold text-foreground mb-3">
                Budget Range
              </FormLabel>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="budgetMin"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="Min amount"
                          className="bg-card border border-border rounded-2xl px-4 py-4 text-card-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary shadow-sm"
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          data-testid="input-budget-min"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="budgetMax"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="Max amount"
                          className="bg-card border border-border rounded-2xl px-4 py-4 text-card-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary shadow-sm"
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          data-testid="input-budget-max"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <FormLabel className="block text-sm font-semibold text-foreground mb-3">
                Location
              </FormLabel>
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <div className="relative">
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter your area or pincode"
                          className="w-full bg-card border border-border rounded-2xl px-4 py-4 pl-12 text-card-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary shadow-sm"
                          data-testid="input-location"
                        />
                      </FormControl>
                      <i className="fas fa-map-marker-alt absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleUseCurrentLocation}
                className="mt-2 text-primary text-sm font-medium flex items-center hover:bg-primary/10"
                data-testid="button-use-location"
              >
                <i className="fas fa-crosshairs mr-1"></i>
                Use current location
              </Button>
            </div>

            {/* Mobile Number */}
            <FormField
              control={form.control}
              name="mobileNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block text-sm font-semibold text-foreground mb-2">
                    Mobile Number
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-muted-foreground text-sm font-medium">+91</span>
                      </div>
                      <Input
                        {...field}
                        type="tel"
                        placeholder="Enter 10-digit mobile number"
                        className="w-full bg-card border border-border rounded-2xl px-4 py-4 pl-12 text-card-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary shadow-sm"
                        data-testid="input-mobile-number"
                        onChange={(e) => {
                          const value = e.target.value;
                          // Only allow numeric digits
                          const numericValue = value.replace(/[^0-9]/g, '');
                          // Limit to 10 digits
                          const limitedValue = numericValue.slice(0, 10);
                          field.onChange(`+91${limitedValue}`);
                        }}
                        value={field.value.replace('+91', '')}
                        maxLength={10}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Pincode */}
            <FormField
              control={form.control}
              name="pincode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block text-sm font-semibold text-foreground mb-2">
                    Pincode (Optional)
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter pincode"
                      className="w-full bg-card border border-border rounded-2xl px-4 py-4 text-card-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary shadow-sm"
                      data-testid="input-pincode"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preferred Time */}
            <FormField
              control={form.control}
              name="preferredTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block text-sm font-semibold text-foreground mb-2">
                    Preferred Time
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger 
                        className="w-full bg-card border border-border rounded-2xl px-4 py-4 text-card-foreground focus:border-primary focus:ring-primary shadow-sm"
                        data-testid="select-preferred-time"
                      >
                        <SelectValue placeholder="Select preferred time" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="asap">ASAP</SelectItem>
                      <SelectItem value="within_2_hours">Within 2 hours</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="tomorrow">Tomorrow</SelectItem>
                      <SelectItem value="this_week">This week</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Photo Upload Placeholder */}
            <div>
              <FormLabel className="block text-sm font-semibold text-foreground mb-3">
                Photos (Optional)
              </FormLabel>
              <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center bg-card/50 hover:bg-card/70 transition-colors cursor-pointer">
                <i className="fas fa-camera text-primary text-3xl mb-3"></i>
                <p className="text-card-foreground text-sm font-medium">Tap to add photos</p>
                <p className="text-xs text-muted-foreground mt-2">Photos help freelancers understand your requirements better</p>
              </div>
            </div>

          </form>
        </Form>
      </div>

      {/* Fixed Submit Button at Bottom */}
      <div 
        className="fixed bottom-0 left-0 right-0 p-6 bg-card/95 backdrop-blur-xl border-t border-border shadow-2xl"
        style={{ zIndex: 9999, position: 'fixed', bottom: 0 }}
      >
        <button
          type="button"
          disabled={createLeadMutation.isPending}
          onClick={async (e) => {
            e.preventDefault();
            console.log('Submit button clicked');
            console.log('Current form values:', form.getValues());
            console.log('Form state:', form.formState);
            
            // Trigger form validation and submission
            const isValid = await form.trigger();
            console.log('Form validation result:', isValid);
            
            // Get form data and call onSubmit directly (validation happens inside onSubmit)
            const formData = form.getValues();
            onSubmit(formData);
          }}
          className="w-full bg-gradient-purple text-white py-5 px-6 rounded-2xl font-bold text-lg hover:scale-105 transition-all duration-200 shadow-2xl disabled:opacity-50 disabled:scale-100"
          data-testid="button-post-job"
        >
          {createLeadMutation.isPending ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Posting...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <i className="fas fa-paper-plane mr-2"></i>
              Post Your Requirement
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
