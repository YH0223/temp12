package com.example.dicomproject.dicomrepo.repository;

import com.example.dicomproject.dicomrepo.entity.Series;
import com.example.dicomproject.dicomrepo.entity.SeriesId;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;


import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface SeriesRepository extends JpaRepository<Series, SeriesId> {
    List<Series> findByStudy_StudyInstanceUid(String studyInstanceUid);
    Optional<Series> findBySeriesInstanceUid(String seriesInstanceUid);

    List<Series> findByStudyKey(Long studyKey);


    List<Series> findByStudyKeyOrderBySeriesKeyAsc(long key);
}