import { useState, useEffect } from "react";
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

interface JobPostingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JobPostingModal({ isOpen, onClose }: JobPostingModalProps) {
  const { user } = useFirebaseAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentLocation, setCurrentLocation] = useState<string>("");

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      if (typeof document !== 'undefined' && document.body) {
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      if (typeof document !== 'undefined' && document.body) {
        document.body.style.overflow = 'unset';
      }
    };
  }, [isOpen, onClose]);

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
      categoryId: "",
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
      form.reset();
      onClose();
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
    if (!user || !user.uid) {
      toast({
        title: "Authentication Error",
        description: "Please log in to post a job",
        variant: "destructive",
      });
      return;
    }
    
    const submitData = {
      ...data,
      customerId: user.uid
    };
    
    createLeadMutation.mutate(submitData);
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
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

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-background rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-border modal-enter">
        {/* Header */}
        <div className="bg-gradient-purple text-white p-6 rounded-t-3xl flex items-center justify-between">
          <h2 className="text-xl font-bold">Post Your Requirement</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/15 p-2 rounded-xl"
          >
            <i className="fas fa-times text-lg"></i>
          </Button>
        </div>

        {/* Form Content */}
        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                          className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-card-foreground focus:border-primary focus:ring-primary shadow-sm"
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
                        className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-card-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary shadow-sm"
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
                        rows={3}
                        placeholder="Describe your requirements in detail..."
                        className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-card-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary shadow-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Budget Range */}
              <div>
                <FormLabel className="block text-sm font-semibold text-foreground mb-2">
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
                            className="bg-card border border-border rounded-2xl px-4 py-3 text-card-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary shadow-sm"
                            onChange={(e) => field.onChange(Number(e.target.value))}
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
                            className="bg-card border border-border rounded-2xl px-4 py-3 text-card-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary shadow-sm"
                            onChange={(e) => field.onChange(Number(e.target.value))}
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
                <FormLabel className="block text-sm font-semibold text-foreground mb-2">
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
                            className="w-full bg-card border border-border rounded-2xl px-4 py-3 pl-12 text-card-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary shadow-sm"
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
                          className="w-full bg-card border border-border rounded-2xl px-4 py-3 pl-12 text-card-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary shadow-sm"
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
                          className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-card-foreground focus:border-primary focus:ring-primary shadow-sm"
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

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={createLeadMutation.isPending}
                className="w-full bg-gradient-purple text-white py-4 px-6 rounded-2xl font-bold text-lg hover:scale-105 transition-all duration-200 shadow-2xl disabled:opacity-50 disabled:scale-100 mt-6"
              >
                {createLeadMutation.isPending ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Posting...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <i className="fas fa-paper-plane mr-2"></i>
                    Post Requirement
                  </div>
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
