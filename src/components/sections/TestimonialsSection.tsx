import { motion } from 'framer-motion';
import { SectionLabel } from '@/components/shared/SectionLabel';
import { TestimonialCard } from '@/components/shared/TestimonialCard';
import { usePortfolioStore } from '@/stores/portfolio-store';
import { containerVariants, itemVariants, viewportOnce } from '@/lib/motion-presets';

export function TestimonialsSection() {
  const data = usePortfolioStore((s) => s.data);
  if (!data.testimonials?.length) return null;
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={containerVariants}
      className="mb-10"
      data-aos="fade-up"
    >
      <motion.div variants={itemVariants}>
        <SectionLabel text="Testimonials" />
      </motion.div>
      <div className="space-y-4">
        {data.testimonials.map((testimonial, index) => (
          <motion.div key={testimonial.id} variants={itemVariants} data-aos="flip-left" data-aos-delay={index * 100}>
            <TestimonialCard testimonial={testimonial} />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
