package com.example.dicomproject.dicomrepo.repository;

import com.example.dicomproject.dicomrepo.dto.ImageMetaDto;
import com.example.dicomproject.dicomrepo.entity.Image;
import com.example.dicomproject.dicomrepo.entity.ImageId;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ImageRepository extends JpaRepository<Image, ImageId> {
    List<Image> findBySeries_SeriesInstanceUid(String seriesInstanceUid);
    Optional<Image> findBySopInstanceUid(String sopInstanceUid);

    Object findAllByStudyKey(Long studyKey);

    @Query("""
      select new com.example.dicomproject.dicomrepo.dto.ImageMetaDto(
        i.studyKey,
        i.seriesKey,
        i.imageKey,
        i.studyInstanceUid,
        i.seriesInstanceUid,
        i.sopInstanceUid,
        i.path,
        i.fname,
        s.modality
      )
      from Image i
      join Series s on s.studyKey = i.studyKey and s.seriesKey = i.seriesKey
      where i.studyKey = :studyKey
      order by s.seriesKey asc, i.imageKey asc
    """)
    List<ImageMetaDto> findAllByStudyKey(@Param("studyKey") long studyKey);
}