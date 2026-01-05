package com.mmlimiteds.mithranmillets.aspect;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.*;
import org.springframework.stereotype.Component;

@Aspect
@Component
@Slf4j
public class CartExceptionAspect {

    @AfterThrowing(pointcut = "execution(* com.mmlimiteds.mithranmillets.service.CartService.*(..))", throwing = "ex")
    public void logServiceException(JoinPoint joinPoint, Throwable ex) {
       /// log.error("❌ Exception in CartService.{}(): {}", joinPoint.getSignature().getName(), ex.getMessage(), ex);
    }

    @AfterThrowing(pointcut = "execution(* com.mmlimiteds.mithranmillets.controller.CartController.*(..))", throwing = "ex")
    public void logControllerException(JoinPoint joinPoint, Throwable ex) {
        ///log.error("❌ Exception in CartController.{}(): {}", joinPoint.getSignature().getName(), ex.getMessage(), ex);
    }
}
