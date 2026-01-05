package com.mmlimiteds.mithranmillets.service;

import java.util.concurrent.TimeUnit;

import jakarta.mail.internet.MimeMessage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.lang.Nullable;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    private final JavaMailSender mailSender; // may be null when no mail bean is present
    private final String from;
    private final String appUrl;
    private final String logoUrl; // optional remote logo
    private final Logger logger = LoggerFactory.getLogger(EmailService.class);

    /**
     * JavaMailSender is optional. If no JavaMailSender bean is present the app will still start;
     * sendOrderStatusEmail will log and no email will be sent.
     */
    public EmailService(@Nullable JavaMailSender mailSender,
                        @Value("${app.email.from:}") String from,
                        @Value("${app.url:}") String appUrl,
                        @Value("${app.email.logo-url:}") String logoUrl) {
        this.mailSender = mailSender;
        this.from = from;
        this.appUrl = appUrl;
        this.logoUrl = logoUrl;
        if (this.mailSender == null) {
            logger.warn("JavaMailSender bean not found. Email sending is disabled.");
        } else {
            logger.info("JavaMailSender is configured. Email sending enabled.");
        }
    }

    /**
     * Send a transactional order status email.
     *
     * @param to recipient email
     * @param status status key (PLACED, SHIPPED, DELIVERED, etc.)
     * @param orderId order identifier (string)
     * @param customerName recipient's display name
     * @param extraHtml optional HTML snippet (order summary, tracking link, etc.)
     */
    @Async
    public void sendOrderStatusEmail(String to, String status, String orderId, String customerName, String extraHtml) {
        if (mailSender == null) {
            logger.warn("Skipping email for order {} to {}: mail sender not configured", orderId, to);
            return;
        }

        if (to == null || to.isBlank()) {
            logger.warn("No recipient for order {} status {}", orderId, status);
            return;
        }

        String subject = buildSubject(status, orderId);
        String html = buildHtml(status, orderId, customerName, extraHtml);
        String text = buildPlainText(status, orderId, customerName);

        int attempts = 0;
        final int maxAttempts = 3;
        while (attempts < maxAttempts) {
            attempts++;
            try {
                MimeMessage msg = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(msg, true, "utf-8");
                helper.setTo(to);
                helper.setSubject(subject);
                helper.setText(html, true); // HTML
                helper.setText(text);       // Plain text alternative for clients that prefer text
                if (from != null && !from.isBlank()) {
                    helper.setFrom(from);
                }

                // Try to load logo from classpath first; if missing, rely on remote URL in HTML
                boolean inlineLogoAdded = false;
                try {
                    Resource logoRes = new ClassPathResource("static/logo.png");
                    if (logoRes.exists()) {
                        helper.addInline("logoImage", logoRes);
                        inlineLogoAdded = true;
                    } else {
                        logger.warn("Inline logo not found at classpath: static/logo.png");
                    }
                } catch (Exception e) {
                    logger.warn("Failed to attach inline logo: {}", e.getMessage());
                }

                // If inline logo not added and remote logo URL is configured, HTML will reference it.
                // No extra action needed here; buildHtml already handles both CID and URL.

                mailSender.send(msg);
                logger.info("Sent order-status email '{}' to {} for order {}", subject, to, orderId);
                return;
            } catch (Exception ex) {
                logger.error("Failed to send email attempt {}/{} for order {} to {}: {}", attempts, maxAttempts, orderId, to, ex.getMessage());
                try { TimeUnit.MILLISECONDS.sleep(250 * attempts); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
            }
        }

        logger.error("Giving up sending email for order {} to {}", orderId, to);
        // Optionally persist failed attempts to DB for later retry or push to a retry queue
    }

    private String buildSubject(String status, String orderId) {
        switch (status) {
            case "PLACED": return "Order " + orderId + " received — Mithran Millets";
            case "PROCESSING": return "We’re preparing your order " + orderId;
            case "PACKED": return "Your order " + orderId + " is packed and ready";
            case "SHIPPED": return "Good news — order " + orderId + " is on its way";
            case "OUT_FOR_DELIVERY": return "Order " + orderId + " is out for delivery";
            case "DELIVERED": return "Delivered — enjoy your Mithran Millets order " + orderId;
            default: return "Update for order " + orderId + " — Mithran Millets";
        }
    }

    private String buildPlainText(String status, String orderId, String name) {
        return "Hi " + safe(name) + ",\n\n"
            + "Your order #" + orderId + " status: " + status + ".\n"
            + "View your order: " + appUrl + "/orders/" + orderId + "\n\n"
            + "Thanks,\nMithran Millets\n(We take grains seriously. Ours are friendly.)";
    }

    private String buildHtml(String status, String orderId, String name, String extraHtml) {
        String accent = "#e9c46a";
        String title;
        String friendlyLine;
        switch (safe(status)) {
            case "PLACED":
                title = "Order received";
                friendlyLine = "We’ve received your order and started the millet magic.";
                break;
            case "PROCESSING":
                title = "Processing your order";
                friendlyLine = "Our team is picking the best grains for you.";
                break;
            case "PACKED":
                title = "Packed and ready";
                friendlyLine = "Carefully packed — no millet left behind.";
                break;
            case "SHIPPED":
                title = "On the way";
                friendlyLine = "A friendly delivery person (and your millets) are en route.";
                break;
            case "OUT_FOR_DELIVERY":
                title = "Out for delivery";
                friendlyLine = "Almost there — please keep an eye out for the delivery hero.";
                break;
            case "DELIVERED":
                title = "Delivered — enjoy!";
                friendlyLine = "Your pantry upgrade has arrived. Time to celebrate (and cook).";
                break;
            default:
                title = "Order update";
                friendlyLine = "Here’s the latest update on your order.";
        }

        // Prefer inline CID logo if present; else use configured logoUrl; else render text badge
        String logoBlock;
        if (logoUrl != null && !logoUrl.isBlank()) {
            logoBlock = "<img src='" + escapeHtml(logoUrl) + "' alt='Mithran Millets' style='width:48px;height:48px;border-radius:8px;object-fit:contain;background:#ffffff;border:1px solid #eee;' />";
        } else {
            // CID reference; if inline not attached, most clients will just show broken image, so provide a fallback text style
            logoBlock = "<img src='cid:logoImage' alt='Mithran Millets' style='width:48px;height:48px;border-radius:8px;object-fit:contain;background:#ffffff;border:1px solid #eee;' onerror=\"this.outerHTML='<div style=\\'width:48px;height:48px;border-radius:8px;background:"
                + accent + ";display:flex;align-items:center;justify-content:center;font-weight:700;color:#102a20\\'>MM</div>'\" />";
        }

        StringBuilder b = new StringBuilder();
        b.append("<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'/>");
        b.append("<title>").append(escapeHtml(title)).append("</title></head><body style='margin:0;background:#f4f6f8;font-family:Inter,Arial,Helvetica,sans-serif;'>");
        b.append("<table width='100%' cellpadding='0' cellspacing='0' role='presentation'><tr><td align='center' style='padding:28px 12px;'>");

        b.append("<table width='600' style='max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 10px 30px rgba(2,6,23,0.08);'>");
        b.append("<tr><td style='padding:22px 28px;border-bottom:1px solid #f0f0f0;'>");
        b.append("<div style='display:flex;align-items:center;gap:12px;'>");
        b.append(logoBlock);
        b.append("<div style='flex:1;'>");
        b.append("<div style='font-size:18px;font-weight:700;color:#102a20'>Mithran Millets</div>");
        b.append("<div style='font-size:13px;color:#667085'>Order update • #").append(escapeHtml(orderId)).append("</div>");
        b.append("</div></div></td></tr>");

        b.append("<tr><td style='padding:22px 28px;'>");
        b.append("<h1 style='margin:0 0 8px;color:").append(accent).append(";font-size:20px;'>").append(escapeHtml(title)).append("</h1>");
        b.append("<p style='margin:0 0 12px;color:#333;font-size:14px;'>Hi ").append(escapeHtml(name)).append(",</p>");
        b.append("<p style='margin:0 0 12px;color:#555;font-size:14px;line-height:1.5;'>").append(escapeHtml(friendlyLine)).append("</p>");

        b.append("<p style='margin:12px 0;'><strong style='display:inline-block;padding:8px 12px;border-radius:999px;background:#f3f4f6;color:#111;font-size:13px;'>Status: <span style='color:").append(accent).append(";'> ").append(escapeHtml(status)).append("</span></strong></p>");

        if (extraHtml != null && !extraHtml.isBlank()) {
            b.append("<div style='margin:12px 0;padding:12px;background:#fcfcfd;border-radius:8px;border:1px solid #f0f0f3;font-size:13px;color:#333;'>");
            b.append(extraHtml);
            b.append("</div>");
        }

        b.append("<p style='margin:16px 0 6px;'><a href='").append(appUrl).append("/orders/").append(escapeHtml(orderId)).append("' style='background:").append(accent).append(";color:#102a20;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:700;'>View your order</a></p>");

        b.append("<p style='margin:14px 0 0;color:#6b7280;font-size:13px;'>If you didn't expect this update, no action is required — unless your pantry stages a revolt. 🥳</p>");

        b.append("</td></tr>");

        b.append("<tr><td style='padding:14px 28px;background:#fafafa;border-top:1px solid #f0f0f0;color:#8892a6;font-size:12px;'>");
        b.append("<div>Need help? Reply to this email or visit <a href='").append(appUrl).append("' style='color:").append(accent).append(";'>").append(escapeHtml(appUrl)).append("</a></div>");
        b.append("<div style='margin-top:8px'>&copy; ").append(java.time.Year.now()).append(" Mithran Millets. All rights reserved.</div>");
        b.append("</td></tr></table>");

        b.append("</td></tr></table></body></html>");
        return b.toString();
    }

    private String safe(String s) {
        return s == null ? "" : s;
    }

    private String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
