import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Priya Sharma',
    location: 'Delhi',
    rating: 5,
    text: 'The quality of Matasree spices is unmatched. My dal tadka has never tasted better! The aroma and freshness are incredible.',
    avatar: 'PS',
  },
  {
    id: 2,
    name: 'Rajesh Kumar',
    location: 'Mumbai',
    rating: 5,
    text: 'Been using their Garam Masala for 10 years. It reminds me of my grandmother\'s cooking. Pure nostalgia in every dish.',
    avatar: 'RK',
  },
  {
    id: 3,
    name: 'Anita Patel',
    location: 'Ahmedabad',
    rating: 5,
    text: 'As a chef, I\'m very particular about my spices. Matasree never disappoints – consistent quality every single time.',
    avatar: 'AP',
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-20 md:py-28 bg-background relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-primary font-medium text-sm uppercase tracking-wider mb-2">Testimonials</span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-2 mb-4">
            What Our <span className="text-gradient-spice">Customers</span> Say
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Don't just take our word for it. Here's what spice lovers across India have to say about us.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={testimonial.id}
              className="group bg-card rounded-3xl p-8 shadow-card hover:shadow-elevated transition-all duration-500 animate-slide-up relative border border-transparent hover:border-primary/10"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Quote icon */}
              <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-gradient-spice flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:-translate-y-1">
                <Quote className="w-5 h-5 text-white" />
              </div>
              
              {/* Rating */}
              <div className="flex gap-1 mb-5">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-primary fill-primary" />
                ))}
              </div>
              
              {/* Text */}
              <p className="text-foreground/80 mb-8 leading-relaxed text-lg italic">
                "{testimonial.text}"
              </p>
              
              {/* Author */}
              <div className="flex items-center gap-4 pt-6 border-t border-border">
                <div className="w-14 h-14 rounded-full bg-gradient-spice flex items-center justify-center text-white font-bold shadow-md">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;