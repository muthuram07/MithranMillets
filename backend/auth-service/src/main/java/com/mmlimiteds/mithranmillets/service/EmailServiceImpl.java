package com.mmlimiteds.mithranmillets.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailServiceImpl.class);

    @Autowired
    private JavaMailSender mailSender;

    @Override
    public void sendSimpleMessage(String to, String subject, String htmlBody) {
        logger.info("Preparing email to '{}' with subject '{}'", to, subject);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "utf-8");

            // optionally set a from address if configured in properties or needed
            // helper.setFrom("no-reply@yourdomain.com");

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            logger.debug("Sending email to '{}'", to);
            mailSender.send(message);
            logger.info("Email successfully sent to '{}'", to);
        } catch (Exception e) {
            logger.error("Failed to send email to '{}': {}", to, e.getMessage(), e);
            throw new RuntimeException("Failed to send email", e);
        }
    }
}
