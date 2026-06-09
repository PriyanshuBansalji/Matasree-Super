import { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronDown, MessageCircleQuestion } from 'lucide-react';

const faqs = [
  { question: 'Are your spices 100% natural?', answer: 'Yes! All Matasree spices are 100% natural with no additives, preservatives, or artificial colors. We use only pure, high-quality ingredients sourced directly from farms.' },
  { question: 'How do you ensure quality?', answer: 'Every batch undergoes rigorous quality testing in certified labs. We test for purity, moisture content, microbial safety, and authenticity before packaging.' },
  { question: 'What is your return policy?', answer: "We offer a 7-day return policy on unopened products. If you receive a damaged or incorrect item, we'll replace it immediately at no extra cost." },
  { question: 'Do you offer free shipping?', answer: 'Yes! We offer free shipping on all orders above ₹499. For orders below ₹499, a nominal shipping charge of ₹49 applies.' },
  { question: 'How should I store the spices?', answer: 'Store spices in a cool, dry place away from direct sunlight. Keep the packets tightly sealed after use. For best flavor, consume within 6 months of opening.' },
  { question: 'Do you sell wholesale?', answer: 'Yes, we offer wholesale pricing for restaurants, hotels, and bulk buyers. Contact us at wholesale@matasreesuper.com for special pricing.' },
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const titleY = useTransform(scrollYProgress, [0, 0.3], ['25%', '0%']);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);

  return (
    <section ref={sectionRef} className="py-32 lg:py-48 bg-[#FDFBF9] relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#E65C19]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#D63220]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            style={{ y: titleY, opacity: titleOpacity }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#D63220]/15 bg-white/80 backdrop-blur-md mb-8 shadow-sm">
              <MessageCircleQuestion className="w-4 h-4 text-[#D63220]" />
              <span className="text-xs font-black tracking-[0.2em] text-[#3E2314] uppercase">Got Questions?</span>
            </div>
            <h2 className="font-serif text-5xl md:text-7xl font-black text-[#3E2314] mb-6 tracking-tight leading-[1.1]">
              Frequently Asked{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D63220] via-[#E65C19] to-[#8B4513] italic">
                Questions
              </span>
            </h2>
            <p className="text-lg md:text-xl text-[#3E2314]/60 max-w-2xl mx-auto font-medium">
              Have questions? We've got answers.
            </p>
          </motion.div>

          {/* FAQ Accordion with scroll-driven stagger */}
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.7, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className={`bg-white rounded-2xl overflow-hidden transition-all duration-500 border-2 ${
                  openIndex === index
                    ? 'border-[#D63220]/25 shadow-[0_12px_40px_rgba(214,50,32,0.06)]'
                    : 'border-[#3E2314]/5 shadow-[0_4px_20px_rgba(62,35,20,0.03)] hover:border-[#3E2314]/10'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-center justify-between p-7 text-left group"
                >
                  <span className={`font-serif text-lg font-bold pr-4 transition-colors duration-300 ${
                    openIndex === index ? 'text-[#D63220]' : 'text-[#3E2314] group-hover:text-[#D63220]'
                  }`}>
                    {faq.question}
                  </span>
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                      openIndex === index
                        ? 'bg-[#D63220] text-white rotate-180 shadow-lg'
                        : 'bg-[#3E2314]/5 text-[#3E2314]/50 group-hover:bg-[#D63220]/10 group-hover:text-[#D63220]'
                    }`}
                  >
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    openIndex === index ? 'max-h-60' : 'max-h-0'
                  }`}
                >
                  <p className="px-7 pb-7 text-[#3E2314]/60 leading-relaxed text-base font-medium">
                    {faq.answer}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;