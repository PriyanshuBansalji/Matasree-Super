import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'Are your spices 100% natural?',
    answer: 'Yes! All Matasree spices are 100% natural with no additives, preservatives, or artificial colors. We use only pure, high-quality ingredients sourced directly from farms.',
  },
  {
    question: 'How do you ensure quality?',
    answer: 'Every batch undergoes rigorous quality testing in certified labs. We test for purity, moisture content, microbial safety, and authenticity before packaging.',
  },
  {
    question: 'What is your return policy?',
    answer: 'We offer a 7-day return policy on unopened products. If you receive a damaged or incorrect item, we\'ll replace it immediately at no extra cost.',
  },
  {
    question: 'Do you offer free shipping?',
    answer: 'Yes! We offer free shipping on all orders above ₹499. For orders below ₹499, a nominal shipping charge of ₹49 applies.',
  },
  {
    question: 'How should I store the spices?',
    answer: 'Store spices in a cool, dry place away from direct sunlight. Keep the packets tightly sealed after use. For best flavor, consume within 6 months of opening.',
  },
  {
    question: 'Do you sell wholesale?',
    answer: 'Yes, we offer wholesale pricing for restaurants, hotels, and bulk buyers. Contact us at wholesale@matasreesuper.com for special pricing.',
  },
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-20 md:py-28 bg-secondary/30 relative overflow-hidden">
      <div className="absolute inset-0 spice-pattern opacity-30" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-14">
            <span className="inline-block text-primary font-medium text-sm uppercase tracking-wider mb-2">FAQ</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4">
              Frequently Asked <span className="text-gradient-spice">Questions</span>
            </h2>
            <p className="text-muted-foreground">
              Have questions? We've got answers. If you can't find what you're looking for, 
              feel free to contact us.
            </p>
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className={`bg-card rounded-2xl shadow-soft overflow-hidden transition-all duration-300 border-2 ${
                  openIndex === index ? 'border-primary/30' : 'border-transparent'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-primary/5 transition-colors"
                >
                  <span className="font-semibold text-foreground pr-4">{faq.question}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    openIndex === index ? 'bg-primary text-white rotate-180' : 'bg-secondary text-foreground'
                  }`}>
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-48' : 'max-h-0'
                }`}>
                  <p className="px-6 pb-6 text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;