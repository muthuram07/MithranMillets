package com.mmlimiteds.mithranmillets.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import feign.RequestInterceptor;

@Configuration
public class FeignClientConfig {

    @Value("${internal.auth.token}")
    private String internalAuthToken;

    @Bean
    public RequestInterceptor internalAuthInterceptor() {
        return requestTemplate -> {
            requestTemplate.header("Internal-Auth", internalAuthToken);
        };
    }
}

