const logger = require('./logger');
const renderEmailService = require('./renderEmailService');
const cloudEmailService = require('./cloudEmailService');

class EmailQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds
  }

  async addEmail(to, subject, html, text = null, priority = 'normal') {
    const emailJob = {
      id: Date.now() + Math.random(),
      to,
      subject,
      html,
      text,
      priority,
      attempts: 0,
      createdAt: new Date(),
      status: 'pending'
    };

    this.queue.push(emailJob);
    logger.info(`Email queued for ${to} (${this.queue.length} in queue)`);

    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }

    return emailJob.id;
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    logger.info(`Processing email queue (${this.queue.length} emails)`);

    while (this.queue.length > 0) {
      const emailJob = this.queue.shift();
      await this.processEmailJob(emailJob);
      
      // Small delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.processing = false;
    logger.info('Email queue processing completed');
  }

  async processEmailJob(emailJob) {
    try {
      emailJob.attempts++;
      emailJob.status = 'processing';
      
      logger.info(`Processing email ${emailJob.id} (attempt ${emailJob.attempts})`);

      // Try render email service first for production
      let result;
      if (process.env.NODE_ENV === 'production') {
        result = await renderEmailService.sendEmail(
          emailJob.to,
          emailJob.subject,
          emailJob.html,
          emailJob.text
        );
      } else {
        result = await cloudEmailService.sendEmail(
          emailJob.to,
          emailJob.subject,
          emailJob.html,
          emailJob.text
        );
      }

      if (result.success) {
        emailJob.status = 'completed';
        logger.info(`Email ${emailJob.id} sent successfully to ${emailJob.to}`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      logger.error(`Email ${emailJob.id} failed (attempt ${emailJob.attempts}):`, error.message);
      
      if (emailJob.attempts < this.maxRetries) {
        // Retry after delay
        emailJob.status = 'pending';
        emailJob.retryAt = new Date(Date.now() + this.retryDelay * emailJob.attempts);
        this.queue.push(emailJob);
        logger.info(`Email ${emailJob.id} queued for retry in ${this.retryDelay * emailJob.attempts}ms`);
      } else {
        emailJob.status = 'failed';
        logger.error(`Email ${emailJob.id} failed after ${this.maxRetries} attempts`);
      }
    }
  }

  getQueueStatus() {
    return {
      total: this.queue.length,
      processing: this.processing,
      pending: this.queue.filter(job => job.status === 'pending').length,
      completed: this.queue.filter(job => job.status === 'completed').length,
      failed: this.queue.filter(job => job.status === 'failed').length
    };
  }
}

module.exports = new EmailQueue();
