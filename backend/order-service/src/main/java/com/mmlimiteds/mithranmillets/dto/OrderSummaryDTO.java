package com.mmlimiteds.mithranmillets.dto;

import java.util.List;

public class OrderSummaryDTO {
    public int totalItems;
    public double subtotal;
    public double tax;
    public double discount;
    public double delivery;
    public double grandTotal;
    public List<OrderItemSummary> items;

    public static class OrderItemSummary {
        public Long productId;
        public String name;
        public int quantity;
        public double unitPrice;
        public double lineTotal;
    }

	public int getTotalItems() {
		return totalItems;
	}

	public void setTotalItems(int totalItems) {
		this.totalItems = totalItems;
	}

	public double getSubtotal() {
		return subtotal;
	}

	public void setSubtotal(double subtotal) {
		this.subtotal = subtotal;
	}

	public double getTax() {
		return tax;
	}

	public void setTax(double tax) {
		this.tax = tax;
	}

	public double getDiscount() {
		return discount;
	}

	public void setDiscount(double discount) {
		this.discount = discount;
	}

	public double getDelivery() {
		return delivery;
	}

	public void setDelivery(double delivery) {
		this.delivery = delivery;
	}

	public double getGrandTotal() {
		return grandTotal;
	}

	public void setGrandTotal(double grandTotal) {
		this.grandTotal = grandTotal;
	}

	public List<OrderItemSummary> getItems() {
		return items;
	}

	public void setItems(List<OrderItemSummary> items) {
		this.items = items;
	}
}

