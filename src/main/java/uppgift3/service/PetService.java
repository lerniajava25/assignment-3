package uppgift3.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.NotFoundException;
import uppgift3.dto.PetDTO;

import java.util.Comparator;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.UnaryOperator;

@ApplicationScoped
public class PetService {

    private static final int FEED_POINTS = 20;
    private static final int PLAY_POINTS = 20;

    private final ConcurrentHashMap<Long, PetDTO> pets = new ConcurrentHashMap<>();
    private final AtomicLong nextId = new AtomicLong();

    public PetDTO create(PetDTO input) {
        long id = nextId.incrementAndGet();
        PetDTO pet = new PetDTO(id, input.name().trim(), input.species().trim(),
                input.hungerLevel(), input.happiness());
        pets.put(id, pet);
        return pet;
    }

    public PetDTO findById(long id) {
        PetDTO pet = pets.get(id);
        if (pet == null) throw notFound(id);
        return pet;
    }

    public PetDTO feed(long id) {
        return update(id, p -> p.withHungerLevel(clamp(p.hungerLevel() - FEED_POINTS)));
    }

    public PetDTO play(long id) {
        return update(id, p -> p.withHappiness(clamp(p.happiness() + PLAY_POINTS)));
    }

    public void delete(long id) {
        if (pets.remove(id) == null) throw notFound(id);
    }

    // ConcurrentHashMap.computeIfPresent gör läs-ändra-skriv atomiskt för 1 "pet"
    private PetDTO update(long id, UnaryOperator<PetDTO> change) {
        PetDTO updated = pets.computeIfPresent(id, (key, current) -> change.apply(current));
        if (updated == null) throw notFound(id);
        return updated;
    }

    private static int clamp(int value) {
        return Math.max(PetDTO.MIN_LEVEL, Math.min(PetDTO.MAX_LEVEL, value));
    }

    private static NotFoundException notFound(long id) {
        return new NotFoundException("Pet " + id + " not found");
    }

    public List<PetDTO> findAll(int offset, int limit, String species, String sortBy, String order) {
        if (offset < 0 || limit < 1) {
            throw new jakarta.ws.rs.BadRequestException();
        }

        Comparator<PetDTO> comparator = switch (sortBy) {
            case "id" -> Comparator.comparingLong(PetDTO::id);
            case "name" -> Comparator.comparing(PetDTO::name, String.CASE_INSENSITIVE_ORDER);
            case "species" -> Comparator.comparing(PetDTO::species, String.CASE_INSENSITIVE_ORDER);
            case "hungerLevel" -> Comparator.comparingInt(PetDTO::hungerLevel);
            case "happiness" -> Comparator.comparingInt(PetDTO::happiness);
            default -> throw new jakarta.ws.rs.BadRequestException();
        };

        if ("desc".equalsIgnoreCase(order)) {
            comparator = comparator.reversed();
        } else if (!"asc".equalsIgnoreCase(order)) {
            throw new jakarta.ws.rs.BadRequestException();
        }

        return pets.values().stream()
                .filter(pet -> species == null || pet.species().equalsIgnoreCase(species))
                .sorted(comparator.thenComparingLong(PetDTO::id))
                .skip(offset)
                .limit(limit)
                .toList();
    }
}
