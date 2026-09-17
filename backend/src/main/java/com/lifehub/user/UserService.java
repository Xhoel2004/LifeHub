package com.lifehub.user;

import com.lifehub.common.exception.EmailAlreadyInUseException;
import com.lifehub.common.exception.ResourceNotFoundException;
import com.lifehub.user.dto.UpdateProfileRequest;
import com.lifehub.user.dto.UserResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * currentUser comes from the JWT principal, resolved outside this method's transaction,
     * so it is detached -- mutating it directly would silently no-op. Re-fetching by id here
     * gives a managed entity that Hibernate will actually flush to the database.
     */
    @Transactional
    public UserResponse updateProfile(User currentUser, UpdateProfileRequest request) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUser.getId()));

        boolean emailChanged = !user.getEmail().equalsIgnoreCase(request.email());
        if (emailChanged && userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyInUseException(request.email());
        }

        user.setDisplayName(request.displayName());
        user.setEmail(request.email());

        return UserMapper.toResponse(user);
    }
}
