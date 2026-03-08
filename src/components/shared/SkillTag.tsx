import { motion } from 'framer-motion';

interface SkillTagProps {
  skill: string;
}

export function SkillTag({ skill }: SkillTagProps) {
  return (
    <motion.span
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      className="inline-flex items-center px-4 py-2 text-sm font-medium bg-surface text-foreground rounded-xl shadow-sm hover:shadow-md hover:bg-primary hover:text-primary-foreground transition-all duration-200 cursor-default border border-outline/20 hover:border-primary"
    >
      {skill}
    </motion.span>
  );
}
