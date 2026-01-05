package com.mmlimiteds.mithranmillets.service;

public interface EmailService {
    void sendSimpleMessage(String to, String subject, String htmlBody);
}
