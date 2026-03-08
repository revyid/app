import { motion } from 'framer-motion';
import { SectionLabel } from '@/components/shared/SectionLabel';
import { ProjectCard } from '@/components/shared/ProjectCard';
import { projects } from '@/data/portfolio-data';
import { containerVariants, itemVariants, viewportOnce } from '@/lib/animations';

export function ProjectsSection() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={containerVariants}
      className="mb-10"
    >
      <motion.div variants={itemVariants}>
        <SectionLabel text="Projects" />
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((project) => (
          <motion.div key={project.id} variants={itemVariants}>
            <ProjectCard project={project} />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
