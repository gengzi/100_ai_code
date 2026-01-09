package com.sinian.nostalgia.service;

import com.sinian.nostalgia.dto.NostalgiaPersonRequest;
import com.sinian.nostalgia.entity.NostalgiaPerson;
import com.sinian.nostalgia.repository.NostalgiaPersonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NostalgiaPersonService {

    private final NostalgiaPersonRepository repository;

    public List<NostalgiaPerson> getAllPersons() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    public NostalgiaPerson getPersonById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("思念人不存在: " + id));
    }

    @Transactional
    public NostalgiaPerson createPerson(NostalgiaPersonRequest request) {
        NostalgiaPerson person = NostalgiaPerson.builder()
                .name(request.getName())
                .description(request.getDescription())
                .relationship(request.getRelationship())
                .personality(request.getPersonality())
                .build();

        return repository.save(person);
    }

    @Transactional
    public NostalgiaPerson updatePerson(Long id, NostalgiaPersonRequest request) {
        NostalgiaPerson person = getPersonById(id);
        person.setName(request.getName());
        person.setDescription(request.getDescription());
        person.setRelationship(request.getRelationship());
        person.setPersonality(request.getPersonality());

        return repository.save(person);
    }

    @Transactional
    public void deletePerson(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("思念人不存在: " + id);
        }
        repository.deleteById(id);
    }

    @Transactional
    public NostalgiaPerson updatePhotoUrl(Long id, String photoUrl) {
        NostalgiaPerson person = getPersonById(id);
        person.setPhotoUrl(photoUrl);
        return repository.save(person);
    }

    @Transactional
    public NostalgiaPerson updateVoiceUrl(Long id, String voiceUrl) {
        NostalgiaPerson person = getPersonById(id);
        person.setVoiceUrl(voiceUrl);
        return repository.save(person);
    }
}
