package uppgift3.dto;

import jakarta.validation.constraints.*;

/**
 * Representerar ett husdjur ("Pet"), används både för inkommande JSON (adoptera djur)
 * och utgående JSON (visa djur). Objektet kan inte ändras.
 *
 * @param id          unikt id. Sätts av servern och ignoreras vid inkommande data
 * @param name        djurets namn. Får inte vara tomt, och max {@value #MAX_TEXT_LENGTH} tecken
 * @param species     art, exempelvis "hund"/eng. "dog". Får inte vara tom, och max {@value #MAX_TEXT_LENGTH}
 * @param hungerLevel hunger mellan {@value #MIN_LEVEL} och {@value #MAX_LEVEL}, där lägre betyder mer hungrig
 * @param happiness   glädje mellan {@value #MIN_LEVEL} och {@value #MAX_LEVEL}, där högre betyder mer glad
 */
public record PetDTO(long id,

                     @NotBlank(message = "name cannot be blank")
                     @Size(max = PetDTO.MAX_TEXT_LENGTH, message = "name cannot exceed " + PetDTO.MAX_TEXT_LENGTH + " characters.")
                     String name,

                     @NotBlank(message = "species cannot be blank")
                     @Size(max = PetDTO.MAX_TEXT_LENGTH, message = "species cannot exceed " + PetDTO.MAX_TEXT_LENGTH + " characters.")
                     String species,

                     @NotNull(message = "hungerLevel is required")
                     @Min(value = PetDTO.MIN_LEVEL, message = "hungerLevel must be at least " + PetDTO.MIN_LEVEL)
                     @Max(value = PetDTO.MAX_LEVEL, message = "hungerLevel cannot exceed " + PetDTO.MAX_LEVEL)
                     Integer hungerLevel,

                     @NotNull(message = "happiness is required")
                     @Min(value = PetDTO.MIN_LEVEL, message = "happiness must be at least " + PetDTO.MIN_LEVEL)
                     @Max(value = PetDTO.MAX_LEVEL, message = "happiness cannot exceed " + PetDTO.MAX_LEVEL)
                     Integer happiness) {

    public static final int MIN_LEVEL = 0;
    public static final int MAX_LEVEL = 100;
    public static final int MAX_TEXT_LENGTH = 20;

    /**
     * Ger en kopia med ett nytt värde på hungerLevel, respektive happiness.
     */
    public PetDTO withHungerLevel(int newHungerLevel) {
        return new PetDTO(id, name, species, newHungerLevel, happiness);
    }

    public PetDTO withHappiness(int newHappiness) {
        return new PetDTO(id, name, species, hungerLevel, newHappiness);
    }
}
