package com.sinian.nostalgia.repository;

import com.sinian.nostalgia.entity.NostalgiaPerson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NostalgiaPersonRepository extends JpaRepository<NostalgiaPerson, Long> {
    List<NostalgiaPerson> findAllByOrderByCreatedAtDesc();
}
