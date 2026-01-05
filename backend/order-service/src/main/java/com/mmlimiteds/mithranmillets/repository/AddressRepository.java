package com.mmlimiteds.mithranmillets.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.mmlimiteds.mithranmillets.entity.Address;

import java.util.List;
import java.util.Optional;

public interface AddressRepository extends JpaRepository<Address, Long> {

    // Retrieve all addresses for a specific user
	Optional<Address> findByUsername(String username);
}
