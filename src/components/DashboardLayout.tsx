'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import AIIcon from './AIIcon';

interface DashboardLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  icon?: ReactNode;
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export function DashboardLayout({ title, subtitle, children, icon }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        className="max-w-7xl mx-auto"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={stagger}
      >
        <motion.div className="text-center" variants={fadeIn}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-6">
            {icon || <AIIcon className="h-8 w-8 text-blue-600" />}
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </motion.div>

        <motion.div
          className="mt-12 grid gap-8 lg:grid-cols-2"
          variants={stagger}
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  color: 'green' | 'blue' | 'purple' | 'yellow';
}

export function FeatureCard({ title, description, icon, color }: FeatureCardProps) {
  const colorClasses = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    yellow: 'bg-yellow-100 text-yellow-600',
  };

  return (
    <motion.li
      className="flex items-start"
      variants={fadeIn}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="flex-shrink-0">
        <div className={`flex items-center justify-center h-10 w-10 rounded-md ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <div className="ml-4">
        <h4 className="text-lg font-medium text-gray-900">{title}</h4>
        <p className="mt-1 text-gray-500">{description}</p>
      </div>
    </motion.li>
  );
}

interface ContentCardProps {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}

export function ContentCard({ title, children, action }: ContentCardProps) {
  return (
    <motion.div
      className="bg-white shadow-lg rounded-xl p-8 border border-gray-100"
      variants={fadeIn}
      whileHover={{ y: -5 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        {action}
      </div>
      {children}
    </motion.div>
  );
}

interface UpgradeCardProps {
  title: string;
  description: string;
  buttonText: string;
  buttonHref: string;
}

export function UpgradeCard({ title, description, buttonText, buttonHref }: UpgradeCardProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        className="max-w-3xl mx-auto"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center">
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-6"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            <AIIcon className="h-8 w-8 text-blue-600" />
          </motion.div>
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            {description}
          </p>
          <motion.div
            className="mt-8"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <a
              href={buttonHref}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
            >
              {buttonText}
            </a>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
} 