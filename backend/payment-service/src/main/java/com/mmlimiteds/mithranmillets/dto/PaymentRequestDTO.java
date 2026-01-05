package com.mmlimiteds.mithranmillets.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequestDTO {

  @NotNull(message = "Amount is required")
  @DecimalMin(value = "0.1", inclusive = true, message = "Amount must be greater than zero")
  private Double amount;

  @NotBlank(message = "Currency is required")
  private String currency;

  @NotBlank(message = "Receipt ID is required")
  private String receipt;

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

  public String getReceipt() {
	return receipt;
  }

  public void setReceipt(String receipt) {
	this.receipt = receipt;
  }
}
