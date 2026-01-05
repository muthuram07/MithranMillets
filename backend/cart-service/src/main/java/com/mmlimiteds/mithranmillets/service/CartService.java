package com.mmlimiteds.mithranmillets.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mmlimiteds.mithranmillets.client.ProductClient;
import com.mmlimiteds.mithranmillets.dto.CartItemDTO;
import com.mmlimiteds.mithranmillets.dto.ProductDTO;
import com.mmlimiteds.mithranmillets.entity.CartItem;
import com.mmlimiteds.mithranmillets.exception.CartItemNotFoundException;
import com.mmlimiteds.mithranmillets.exception.ProductUnavailableException;
import com.mmlimiteds.mithranmillets.repository.CartRepository;

@Service
public class CartService {

    @Autowired
    private CartRepository repository;

    @Autowired
    private ModelMapper modelMapper;

    @Autowired
    private ProductClient productClient;

    public List<CartItemDTO> getAllItems() {
        String username = getCurrentUsername();
        return repository.findByUsername(username).stream()
                .map(item -> modelMapper.map(item, CartItemDTO.class))
                .collect(Collectors.toList());
    }

    public List<CartItemDTO> getAllItemsForUser(String username) {
        List<CartItem> items = repository.findByUsername(username);
        return items.stream()
                .map(item -> modelMapper.map(item, CartItemDTO.class))
                .collect(Collectors.toList());
    }

    @Transactional
    public CartItemDTO addItem(Long productId, int quantity) {
        ProductDTO product = productClient.getProductById(productId);
        if (product == null || product.getName().equalsIgnoreCase("Unavailable") || product.getStock() == null || product.getStock() < quantity) {
            throw new ProductUnavailableException(productId);
        }

        String username = getCurrentUsername();
        CartItem existing = repository.findByUsernameAndProductId(username, productId);
        if (existing != null) {
            existing.setQuantity(existing.getQuantity() + quantity);
            CartItem saved = repository.save(existing);
            return modelMapper.map(saved, CartItemDTO.class);
        }

        CartItem item = new CartItem();
        item.setUsername(username);
        item.setProductId(productId);
        item.setProductName(product.getName());
        item.setPrice(product.getPrice());
        item.setQuantity(quantity);
        item.setImageUrl(product.getImageDownloadUrl()); // ✅ uses imageDownloadUrl from ProductDTO

        CartItem saved = repository.save(item);
        return modelMapper.map(saved, CartItemDTO.class);
    }

    @Transactional
    public CartItemDTO updateItem(CartItemDTO dto) {
        Optional<CartItem> existing = repository.findById(dto.getId());
        if (existing.isEmpty() || !existing.get().getUsername().equals(getCurrentUsername())) {
            throw new CartItemNotFoundException(dto.getId());
        }

        CartItem item = modelMapper.map(dto, CartItem.class);
        item.setUsername(getCurrentUsername());

        // Ensure imageUrl is set if missing
        if (item.getImageUrl() == null || item.getImageUrl().isBlank()) {
            ProductDTO product = productClient.getProductById(item.getProductId());
            item.setImageUrl(product.getImageDownloadUrl());
        }

        CartItem updated = repository.save(item);
        return modelMapper.map(updated, CartItemDTO.class);
    }

    @Transactional
    public CartItemDTO updateQuantity(Long productId, int quantity) {
        String username = getCurrentUsername();
        CartItem item = repository.findByUsernameAndProductId(username, productId);
        if (item == null) {
            throw new CartItemNotFoundException(productId);
        }

        ProductDTO product = productClient.getProductById(productId);
        if (product == null || product.getStock() == null || product.getStock() < quantity) {
            throw new ProductUnavailableException(productId);
        }

        item.setQuantity(quantity);

        // Ensure imageUrl is set if missing
        if (item.getImageUrl() == null || item.getImageUrl().isBlank()) {
            item.setImageUrl(product.getImageDownloadUrl());
        }

        CartItem saved = repository.save(item);
        return modelMapper.map(saved, CartItemDTO.class);
    }

    @Transactional
    public boolean removeItem(Long id) {
        Optional<CartItem> item = repository.findById(id);
        if (item.isPresent() && item.get().getUsername().equals(getCurrentUsername())) {
            repository.deleteById(id);
            return true;
        }
        throw new CartItemNotFoundException(id);
    }

    @Transactional
    public void clearCartForUser(String username) {
        List<CartItem> items = repository.findByUsername(username);
        repository.deleteAll(items);
    }

    public String getCurrentUsername() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

	public CartRepository getRepository() {
		return repository;
	}

	public void setRepository(CartRepository repository) {
		this.repository = repository;
	}

	public ModelMapper getModelMapper() {
		return modelMapper;
	}

	public void setModelMapper(ModelMapper modelMapper) {
		this.modelMapper = modelMapper;
	}

	public ProductClient getProductClient() {
		return productClient;
	}

	public void setProductClient(ProductClient productClient) {
		this.productClient = productClient;
	}
}
