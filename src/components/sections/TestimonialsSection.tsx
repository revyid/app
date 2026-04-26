import { motion } from 'framer-motion';
import { SectionLabel } from '@/components/shared/SectionLabel';
import { TestimonialCard } from '@/components/shared/TestimonialCard';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { containerVariants, itemVariants, viewportOnce } from '@/lib/animations';

export function TestimonialsSection() {
  const { data } = usePortfolio();
  if (!data.testimonials?.length) return null;
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={containerVariants}
      className="mb-10"
    >
      <motion.div variants={itemVariants}>
        <SectionLabel text="Testimonials" />
      </motion.div>
      <div className="space-y-4">
        {data.testimonials.map((testimonial) => (
          <motion.div key={testimonial.id} variants={itemVariants}>
            <TestimonialCard testimonial={testimonial} />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
