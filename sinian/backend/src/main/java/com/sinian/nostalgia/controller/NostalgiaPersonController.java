package com.sinian.nostalgia.controller;

import com.sinian.nostalgia.dto.NostalgiaPersonRequest;
import com.sinian.nostalgia.entity.NostalgiaPerson;
import com.sinian.nostalgia.service.FileStorageService;
import com.sinian.nostalgia.service.NostalgiaPersonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/persons")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NostalgiaPersonController {

    private final NostalgiaPersonService personService;
    private final FileStorageService fileStorageService;

    @GetMapping
    public ResponseEntity<List<NostalgiaPerson>> getAllPersons() {
        return ResponseEntity.ok(personService.getAllPersons());
    }

    @GetMapping("/{id}")
    public ResponseEntity<NostalgiaPerson> getPersonById(@PathVariable Long id) {
        return ResponseEntity.ok(personService.getPersonById(id));
    }

    @PostMapping
    public ResponseEntity<NostalgiaPerson> createPerson(@Valid @RequestBody NostalgiaPersonRequest request) {
        NostalgiaPerson person = personService.createPerson(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(person);
    }

    @PutMapping("/{id}")
    public ResponseEntity<NostalgiaPerson> updatePerson(
            @PathVariable Long id,
            @Valid @RequestBody NostalgiaPersonRequest request) {
        NostalgiaPerson person = personService.updatePerson(id, request);
        return ResponseEntity.ok(person);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePerson(@PathVariable Long id) {
        personService.deletePerson(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/photo")
    public ResponseEntity<NostalgiaPerson> uploadPhoto(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        try {
            String photoUrl = fileStorageService.storeFile(file, "photos");
            NostalgiaPerson person = personService.updatePhotoUrl(id, photoUrl);
            return ResponseEntity.ok(person);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{id}/voice")
    public ResponseEntity<NostalgiaPerson> uploadVoice(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        try {
            String voiceUrl = fileStorageService.storeFile(file, "voices");
            NostalgiaPerson person = personService.updateVoiceUrl(id, voiceUrl);
            return ResponseEntity.ok(person);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
