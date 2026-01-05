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

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  @NotBlank(message = "Username is required")
  private String username;

  @Column(name = "subtotal", precision = 15, scale = 2)
  @DecimalMin(value = "0.00", inclusive = true, message = "Subtotal must be >= 0")
  private BigDecimal subtotal;

  @NotNull(message = "Total amount is required")
  @Column(name = "total_amount", precision = 15, scale = 2, nullable = false)
  @DecimalMin(value = "0.00", inclusive = false, message = "Amount must be greater than zero")
  private BigDecimal totalAmount;

  @NotNull(message = "Total quantity is required")
  @Min(value = 0, message = "Quantity must be >= 0")
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

  // ✅ Include this to support item-level history
  @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<OrderItem> orderItems;

}
