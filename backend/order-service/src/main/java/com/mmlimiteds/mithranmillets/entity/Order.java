package com.mmlimiteds.mithranmillets.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.util.Date;
import java.util.List;
import java.math.BigDecimal;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "orders")
public class Order {

    /* =========================
       GETTERS & SETTERS
       ========================= */

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

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public Integer getTotalQuantity() {
        return totalQuantity;
    }

    public void setTotalQuantity(Integer totalQuantity) {
        this.totalQuantity = totalQuantity;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Date getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(Date orderDate) {
        this.orderDate = orderDate;
    }

    public Address getAddress() {
        return address;
    }

    public void setAddress(Address address) {
        this.address = address;
    }

    public String getRazorpayOrderId() {
        return razorpayOrderId;
    }

    public void setRazorpayOrderId(String razorpayOrderId) {
        this.razorpayOrderId = razorpayOrderId;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public List<OrderItem> getOrderItems() {
        return orderItems;
    }

    public void setOrderItems(List<OrderItem> orderItems) {
        this.orderItems = orderItems;
    }

    public List<OrderStatusHistory> getStatusHistory() {
        return statusHistory;
    }

    public void setStatusHistory(List<OrderStatusHistory> statusHistory) {
        this.statusHistory = statusHistory;
    }

    /* =========================
       FIELDS
       ========================= */

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    @NotBlank(message = "Username is required")
    private String username;

    @Column(name = "subtotal", precision = 15, scale = 2)
    @DecimalMin(value = "0.00", inclusive = true)
    private BigDecimal subtotal;

    @NotNull(message = "Total amount is required")
    @Column(name = "total_amount", precision = 15, scale = 2, nullable = false)
    @DecimalMin(value = "0.00", inclusive = false)
    private BigDecimal totalAmount;

    @NotNull(message = "Total quantity is required")
    @Min(value = 0)
    @Column(name = "total_quantity", nullable = false)
    private Integer totalQuantity;

    @NotBlank(message = "Payment method is required")
    private String paymentMethod;

    @NotBlank(message = "Order status is required")
    private String status;

    @Temporal(TemporalType.TIMESTAMP)
    @NotNull(message = "Order date is required")
    private Date orderDate;

    @ManyToOne(optional = false)
    @JoinColumn(name = "address_id")
    @NotNull(message = "Address is required")
    private Address address;

    @Column(name = "razorpay_order_id")
    private String razorpayOrderId;

    @Column(name = "payment_status")
    private String paymentStatus;

    /* =========================
       RELATIONSHIPS (CRITICAL)
       ========================= */

    // ✅ Order → OrderItems
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> orderItems;

    // ✅ Order → OrderStatusHistory (THIS FIXES DELETE)
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderStatusHistory> statusHistory;
}
