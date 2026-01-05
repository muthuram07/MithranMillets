package com.mmlimiteds.mithranmillets.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequestDTO {
  private Double amount;
  private String currency;
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
