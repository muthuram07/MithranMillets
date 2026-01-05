package com.mmlimiteds.mithranmillets.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.util.Date;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Payment {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @NotBlank(message = "Username is required")
  @Column(nullable = false)
  private String username;

  @NotBlank(message = "Razorpay order ID is required")
  private String razorpayOrderId;

  @NotBlank(message = "Receipt is required")
  private String receipt;

  @NotNull(message = "Amount is required")
  @DecimalMin(value = "0.1", inclusive = true, message = "Amount must be greater than zero")
  private Double amount;

  @NotBlank(message = "Currency is required")
  private String currency;

  @NotBlank(message = "Payment status is required")
  private String status;

  @NotNull(message = "Created date is required")
  @Temporal(TemporalType.TIMESTAMP)
  private Date createdAt;

  public Long getId() {
	return id;
  }

  public void setId(Long id) {
	this.id = id;
  }

  public String getUsername() {
	return username;
  }

  public void setUsername(String username) {
	this.username = username;
  }

  public String getRazorpayOrderId() {
	return razorpayOrderId;
  }

  public void setRazorpayOrderId(String razorpayOrderId) {
	this.razorpayOrderId = razorpayOrderId;
  }

  public String getReceipt() {
	return receipt;
  }

  public void setReceipt(String receipt) {
	this.receipt = receipt;
  }

  public Double getAmount() {
	return amount;
  }

  public void setAmount(Double amount) {
	this.amount = amount;
  }

  public String getCurrency() {
	return currency;
  }

  public void setCurrency(String currency) {
	this.currency = currency;
  }

  public String getStatus() {
	return status;
  }

  public void setStatus(String status) {
	this.status = status;
  }

  public Date getCreatedAt() {
	return createdAt;
  }

  public void setCreatedAt(Date createdAt) {
	this.createdAt = createdAt;
  }
}
