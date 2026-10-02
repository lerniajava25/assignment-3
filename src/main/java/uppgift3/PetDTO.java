package uppgift3;

import jakarta.validation.constraints.*;

/**
 * Representerar ett husdjur ("Pet"), används både för inkommande JSON (adoptera djur)
 * och utgående JSON (visa djur). Objektet kan inte ändras.
 *
 * @param id          unikt id, sätts av servern och ignoreras vid inkommande data
 * @param name        djurets namn (får inte vara tomt, och max 20 tecken)
 * @param species     art, exempelvis "hund"/"dog" (får inte vara tom, och max 20 tecken)
 * @param hungerLevel hunger mellan 0 och 100, där lägre betyder mindre hungrig
 * @param happiness   glädje mellan 0 och 100, där högre betyder gladare
 */
public record PetDTO(int id,

                     @NotBlank(message = "name cannot be blank") @Size(max = 20, message = "name cannot exceed 20 characters") String name,

                     @NotBlank(message = "species cannot be blank") @Size(max = 20, message = "species cannot exceed 20 characters") String species,

                     @NotNull(message = "hungerLevel is required") @Min(0) @Max(100) Integer hungerLevel,

                     @NotNull(message = "happiness is required") @Min(0) @Max(100) Integer happiness) {

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
