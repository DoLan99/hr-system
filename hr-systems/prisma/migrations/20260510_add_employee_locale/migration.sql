-- Add locale preference to employees
ALTER TABLE `employees` ADD COLUMN IF NOT EXISTS `locale` TEXT NOT NULL DEFAULT 'en';
