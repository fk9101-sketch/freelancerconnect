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

const jobPostingSchema = insertLeadSchema.extend({
  budgetMin: z.number().min(1, "Minimum budget is required"),
  budgetMax: z.number().min(1, "Maximum budget is required"),
}).refine((data) => data.budgetMax >= data.budgetMin, {
  message: "Maximum budget must be greater than or equal to minimum budget",
  path: ["budgetMax"],
});

type JobPostingForm = z.infer<typeof jobPostingSchema>;

export default function JobPosting() {
  const { isAuthenticated, isLoading } = useFirebaseAuth();
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
    createLeadMutation.mutate(data);
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
    <div className="min-h-screen">
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
      <div className="bg-gradient-purple text-white p-4 flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGoBack}
          className="mr-4 text-white hover:bg-white/10"
          data-testid="button-go-back"
        >
          <i className="fas fa-arrow-left text-lg"></i>
        </Button>
        <h2 className="text-lg font-semibold">Post a Job</h2>
      </div>

      {/* Form Content */}
      <div className="p-4 pb-24">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Category Selection */}
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block text-sm font-medium text-on-surface">
                    Service Category
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger 
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-700 focus:border-primary focus:ring-primary"
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
                  <FormLabel className="block text-sm font-medium text-on-surface">
                    Job Title
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Fix ceiling fan"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-700 focus:border-primary focus:ring-primary"
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
                  <FormLabel className="block text-sm font-medium text-on-surface">
                    Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      placeholder="Describe your requirements in detail..."
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-700 focus:border-primary focus:ring-primary"
                      data-testid="textarea-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Budget Range */}
            <div>
              <FormLabel className="block text-sm font-medium text-on-surface mb-2">
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
                          className="border border-gray-300 rounded-xl px-4 py-3 text-gray-700 focus:border-primary focus:ring-primary"
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
                          className="border border-gray-300 rounded-xl px-4 py-3 text-gray-700 focus:border-primary focus:ring-primary"
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
              <FormLabel className="block text-sm font-medium text-on-surface mb-2">
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
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 pl-10 text-gray-700 focus:border-primary focus:ring-primary"
                          data-testid="input-location"
                        />
                      </FormControl>
                      <i className="fas fa-map-marker-alt absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"></i>
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

            {/* Pincode */}
            <FormField
              control={form.control}
              name="pincode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block text-sm font-medium text-on-surface">
                    Pincode (Optional)
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter pincode"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-700 focus:border-primary focus:ring-primary"
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
                  <FormLabel className="block text-sm font-medium text-on-surface">
                    Preferred Time
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger 
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-700 focus:border-primary focus:ring-primary"
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
              <FormLabel className="block text-sm font-medium text-on-surface mb-2">
                Photos (Optional)
              </FormLabel>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                <i className="fas fa-camera text-gray-400 text-2xl mb-2"></i>
                <p className="text-gray-500 text-sm">Tap to add photos</p>
                <p className="text-xs text-gray-400 mt-1">Photos help freelancers understand your requirements better</p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8 mb-4">
              <Button
                type="submit"
                disabled={createLeadMutation.isPending}
                className="w-full bg-gradient-purple text-white py-4 rounded-xl font-medium text-lg hover:opacity-90 transition-opacity shadow-lg"
                data-testid="button-post-job"
              >
                {createLeadMutation.isPending ? (
                  <div className="flex items-center justify-center">
                    <div className="spinner mr-2"></div>
                    Posting...
                  </div>
                ) : (
                  "Post Your Requirement"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
