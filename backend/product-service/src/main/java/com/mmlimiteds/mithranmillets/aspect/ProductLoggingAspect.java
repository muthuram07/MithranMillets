package com.mmlimiteds.mithranmillets.aspect;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.*;
import org.aspectj.lang.annotation.*;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Aspect
@Component
@Slf4j
public class ProductLoggingAspect {

    // Log before controller methods
    @Before("execution(* com.mmlimiteds.mithranmillets.controller.ProductController.*(..))")
    public void logControllerEntry(JoinPoint joinPoint) {
        ///log.info("➡️ Entering Controller: {} with args {}", joinPoint.getSignature(), Arrays.toString(joinPoint.getArgs()));
    }

    // Log after controller methods
    @AfterReturning(pointcut = "execution(* com.mmlimiteds.mithranmillets.controller.ProductController.*(..))", returning = "result")
    public void logControllerExit(JoinPoint joinPoint, Object result) {
        ///log.info("⬅️ Exiting Controller: {} with result {}", joinPoint.getSignature(), result);
    }

    // Log before service methods
    @Before("execution(* com.mmlimiteds.mithranmillets.service.ProductService.*(..))")
    public void logServiceEntry(JoinPoint joinPoint) {
       /// log.info("🔍 Entering Service: {} with args {}", joinPoint.getSignature(), Arrays.toString(joinPoint.getArgs()));
    }

    // Log after service methods
    @AfterReturning(pointcut = "execution(* com.mmlimiteds.mithranmillets.service.ProductService.*(..))", returning = "result")
    public void logServiceExit(JoinPoint joinPoint, Object result) {
       /// log.info("✅ Exiting Service: {} with result {}", joinPoint.getSignature(), result);
    }

    // Log exceptions in controller and service
    @AfterThrowing(pointcut = "execution(* com.mmlimiteds.mithranmillets.controller.ProductController.*(..)) || execution(* com.mmlimiteds.mithranmillets.service.ProductService.*(..))", throwing = "ex")
    public void logException(JoinPoint joinPoint, Throwable ex) {
       /// log.error("❌ Exception in {}: {}", joinPoint.getSignature(), ex.getMessage(), ex);
    }
}
