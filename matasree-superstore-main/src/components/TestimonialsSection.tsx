import { useRef, useState, useMemo } from 'react';
import { Star, Quote, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import TestimonialSkeleton from '@/components/skeletons/TestimonialSkeleton';

const fallbackTestimonials = [
  { id: '1', name: 'Priya Sharma', location: 'Delhi', rating: 5, text: 'The quality of Matasree spices is unmatched. My dal tadka has never tasted better! The aroma and freshness are incredible.', avatar: 'PS' },
  { id: '2', name: 'Rajesh Kumar', location: 'Mumbai', rating: 5, text: "Been using their Garam Masala for 10 years. It reminds me of my grandmother's cooking. Pure nostalgia in every dish.", avatar: 'RK' },
  { id: '3', name: 'Anita Patel', location: 'Ahmedabad', rating: 5, text: "As a chef, I'm very particular about my spices. Matasree never disappoints – consistent quality every single time.", avatar: 'AP' },
];

interface ReviewData {
  _id: string;
  name: string;
  rating: number;
  comment: string;
}

const TestimonialCard = ({ testimonial, index, scrollProgress }: { testimonial: typeof fallbackTestimonials[0]; index: number; scrollProgress: ReturnType<typeof useScroll>['scrollYProgress'] }) => {
  const smoothProgress = useSpring(scrollProgress, { damping: 30, stiffness: 80 });
  // Staggered vertical parallax per column
  const yRanges: [string, string][] = [['8%', '-8%'], ['15%', '-15%'], ['10%', '-10%']];
  const parallaxY = useTransform(smoothProgress, [0, 1], yRanges[index % 3]);

  return (
    <motion.div
      style={{ y: parallaxY }}
      className="h-full"
    >
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.9 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.9, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
        className="group bg-[#FDFBF9] rounded-[2rem] p-10 border border-[#3E2314]/5 hover:border-[#D63220]/15 shadow-[0_8px_30px_rgba(62,35,20,0.04)] hover:shadow-[0_25px_60px_rgba(62,35,20,0.1)] transition-all duration-700 relative h-full flex flex-col"
      >
        {/* Quote icon */}
        <div className="absolute -top-4 -right-4 w-12 h-12 rounded-xl bg-gradient-to-br from-[#D63220] to-[#E65C19] flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:-translate-y-1">
          <Quote className="w-5 h-5 text-white" />
        </div>

        {/* Stars */}
        <div className="flex gap-1 mb-6">
          {[...Array(5)].map((_: unknown, i: number) => (
            <Star key={i} className={`w-5 h-5 ${i < testimonial.rating ? 'fill-brand-turmeric text-brand-turmeric drop-shadow-sm' : 'text-gray-200'}`} />
          ))}
        </div>

        {/* Review text */}
        <p className="text-[#3E2314]/80 mb-10 leading-relaxed text-lg font-serif italic flex-1">
          "{testimonial.text}"
        </p>

        {/* Author */}
        <div className="flex items-center gap-4 pt-6 border-t border-[#3E2314]/5 mt-auto">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#D63220] to-[#E65C19] flex items-center justify-center text-white font-black shadow-md">
            {testimonial.avatar}
          </div>
          <div>
            <p className="font-black text-[#3E2314]">{testimonial.name}</p>
            {testimonial.location && <p className="text-sm text-[#3E2314]/40 font-medium">{testimonial.location}</p>}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const TestimonialsSection = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', rating: 5, comment: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const titleY = useTransform(scrollYProgress, [0, 0.3], ['25%', '0%']);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);

  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['featured-reviews'],
    queryFn: () => apiClient.getFeaturedReviews(),
    staleTime: 5 * 60 * 1000,
  });

  const dynamicReviews = useMemo(() => {
    const reviews = reviewsData?.data?.data || [];
    return Array.isArray(reviews) ? reviews : [];
  }, [reviewsData]);

  const allTestimonials = dynamicReviews.length > 0
    ? dynamicReviews.map((r: ReviewData) => ({
      id: r._id,
      name: r.name,
      location: '',
      rating: r.rating,
      text: r.comment,
      avatar: r.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
    }))
    : fallbackTestimonials;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.comment.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setIsSubmitting(true);
    try {
      await apiClient.submitReview(formData);
      toast.success('Thank you for your feedback! 🎉', { description: 'Your review will be visible after approval.' });
      setFormData({ name: '', rating: 5, comment: '' });
      setShowForm(false);
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to submit review';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section ref={sectionRef} className="pb-32 lg:pb-48 bg-brand-cream relative overflow-hidden">
      <div className="absolute top-[-5%] left-[-5%] w-[500px] h-[500px] bg-[#E65C19]/3 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[500px] h-[500px] bg-[#D63220]/3 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        {/* Header */}
        <motion.div
          style={{ y: titleY, opacity: titleOpacity }}
          className="text-center mb-20"
        >
          <span className="text-[#D63220] font-black tracking-[0.3em] uppercase text-sm mb-6 block">
            Testimonials
          </span>
          <h2 className="font-serif text-5xl md:text-7xl font-black text-[#3E2314] mb-6 tracking-tight leading-[1.1]">
            What Our{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D63220] via-[#E65C19] to-[#8B4513] italic">
              Customers
            </span>{' '}
            Say
          </h2>
          <p className="text-lg md:text-xl text-[#3E2314]/50 max-w-2xl mx-auto font-medium">
            Don't just take our word for it. Here's what spice lovers across India have to say.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {isLoading
            ? [0, 1, 2].map((i) => <TestimonialSkeleton key={i} />)
            : allTestimonials.slice(0, 3).map((testimonial: typeof fallbackTestimonials[0], index: number) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} index={index} scrollProgress={scrollYProgress} />
            ))
          }
        </div>

        {/* Submit Feedback CTA */}
        <div className="text-center">
          {!showForm ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-[#D63220] to-[#E65C19] text-white font-bold px-10 py-6 rounded-full shadow-[0_20px_40px_rgba(214,50,32,0.2)] hover:shadow-[0_20px_50px_rgba(214,50,32,0.3)] hover:scale-[1.03] transition-all text-lg"
              >
                Share Your Experience ✨
              </Button>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              onSubmit={handleSubmit}
              className="max-w-lg mx-auto bg-[#FDFBF9] rounded-[2rem] p-10 shadow-[0_20px_60px_rgba(62,35,20,0.06)] border border-[#3E2314]/5"
            >
              <h3 className="font-serif text-2xl font-black text-[#3E2314] mb-8">Leave a Review</h3>
              <div className="mb-5">
                <Input
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-white border-[#3E2314]/10 rounded-xl py-5 focus:border-[#D63220]/40 focus:ring-[#D63220]/20"
                  required
                />
              </div>
              <div className="mb-5">
                <p className="text-sm font-bold text-[#3E2314] mb-2">Rating</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className="p-1 hover:scale-125 transition-transform"
                    >
                      <Star className={`w-8 h-8 transition-colors ${star <= (hoverRating || formData.rating) ? 'fill-[#E65C19] text-[#E65C19]' : 'fill-gray-100 text-gray-200'}`} />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-[#3E2314]/40 font-bold">{formData.rating}/5</span>
                </div>
              </div>
              <div className="mb-8">
                <Textarea
                  placeholder="Share your experience with Matasree spices..."
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  className="bg-white border-[#3E2314]/10 rounded-xl min-h-[120px] focus:border-[#D63220]/40 focus:ring-[#D63220]/20"
                  required
                />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1 rounded-xl py-5 border-[#3E2314]/10 text-[#3E2314] hover:bg-[#3E2314]/5">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 bg-gradient-to-r from-[#D63220] to-[#E65C19] text-white rounded-xl py-5 font-bold hover:shadow-lg transition-all">
                  {isSubmitting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>) : (<><Send className="w-4 h-4 mr-2" /> Submit Review</>)}
                </Button>
              </div>
            </motion.form>
          )}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;