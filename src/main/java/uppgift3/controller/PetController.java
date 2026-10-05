package uppgift3.controller;

import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import uppgift3.dto.PetDTO;
import uppgift3.service.PetService;

import java.util.List;

@Path("/pets")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)

public class PetController{
    @Inject
    PetService petService;

    @POST
    public Response adoptPet(@Valid PetDTO pet) {
        PetDTO adoptedPet = petService.create(pet);

        return Response.status(Response.Status.CREATED)
                .entity(adoptedPet)
                .build();
    }

    @GET
    public Response listAllPets() {
        List<PetDTO> pets = petService.findAll();

        return Response.status(Response.Status.OK)
                .entity(pets)
                .build();
    }

    @GET
    @Path("/{id}")
    public Response viewPetStatus(@PathParam("id") long id) {
        var pet = petService.findById(id);

        return Response.status(Response.Status.OK)
                .entity(pet)
                .build();
    }

    @PUT
    @Path("/{id}/feed")
    public Response feedThePet(@PathParam("id") long id) {
        var reduceHunger = petService.feed(id);

        return Response.status(Response.Status.OK)
                .entity(reduceHunger)
                .build();
    }

    @PUT
    @Path("/{id}/play")
    public Response playWithThePet(@PathParam("id") long id) {
        var increaseHappiness = petService.play(id);

        return Response.status(Response.Status.OK)
                .entity(increaseHappiness)
                .build();
    }

    @DELETE
    @Path("/{id}")
    public Response releaseThePet(@PathParam("id") long id) {
        petService.delete(id);

        return Response.noContent()
                .build();
    }
}