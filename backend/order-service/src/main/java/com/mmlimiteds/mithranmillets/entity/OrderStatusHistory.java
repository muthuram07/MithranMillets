package com.mmlimiteds.mithranmillets.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.Date;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "order_status_history")
public class OrderStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "status", nullable = false, length = 64)
    private String status;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "changed_at", nullable = false)
    private Date changedAt = new Date();

    @Column(name = "changed_by")
    private String changedBy;
}


