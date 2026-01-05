package com.mmlimiteds.mithranmillets.config;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.HexFormat;

public class TokenUtil {
 private static final SecureRandom secureRandom = new SecureRandom();
 private static final int TOKEN_BYTES = 32;

 public static String generateRawToken() {
     byte[] bytes = new byte[TOKEN_BYTES];
     secureRandom.nextBytes(bytes);
     return HexFormat.of().formatHex(bytes);
 }

 public static String sha256Hex(String data) {
     try {
         MessageDigest digest = MessageDigest.getInstance("SHA-256");
         byte[] hashed = digest.digest(data.getBytes(StandardCharsets.UTF_8));
         return HexFormat.of().formatHex(hashed);
     } catch (Exception e) {
         throw new RuntimeException(e);
     }
 }
}

