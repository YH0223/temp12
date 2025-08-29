package com.example.dicomproject.dicomrepo.repository;

import com.example.dicomproject.dicomrepo.dto.StudyProjection;
import com.example.dicomproject.dicomrepo.entity.Study;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StudyRepository extends JpaSpecificationExecutor<Study>, JpaRepository<Study, Long> {
    Optional<Study> findByStudyInstanceUid(String studyInstanceUid);
    List<Study> findByPatient_Pid(String pid);
    List<Study> findByPatient_PidAndStudyDateBetween(String pid, String from, String to);

    @Query("""
  select
    s.studyKey as studyKey,
    s.studyInstanceUid as studyUid,
    s.studyDate        as studyDate,
    s.studyTime        as studyTime,
    s.studyDesc        as studyDesc,
    s.modality         as modality,
    s.bodyPart         as bodyPart,
    s.accessionNumber  as accessionNum,
    p.pid              as pid,
    p.name             as pname
  from Study s
  left join s.patient p
  where

    ( :q is null
      or p.pid  like concat('%', :q, '%')
      or p.name like concat('%', :q, '%')
    )

    and ( :accession is null or s.accessionNumber like concat('%', :accession, '%') )


    and ( :studyDesc is null or s.studyDesc like concat('%', :studyDesc, '%') )


    and ( :modalities is null or s.modality in :modalities )


    and ( :bodyPart is null or s.bodyPart = :bodyPart )

    and ( :fromDate is null or s.studyDate >= :fromDate )
    and ( :toDate   is null or s.studyDate <= :toDate )

  order by s.studyDate desc, s.studyTime desc
""")
    Page<StudyProjection> search(
            @Param("q")          String q,                // pid 또는 name을 한 번에 검색
            @Param("accession")  String accession,        // null이면 무시
            @Param("studyDesc")  String studyDesc,        // null이면 무시
            @Param("modalities") List<String> modalities, // 비거나 null이면 무시
            @Param("bodyPart")   String bodyPart,         // null이면 무시
            @Param("fromDate")   String fromDate,         // 'YYYYMMDD' 또는 null
            @Param("toDate")     String toDate,           // 'YYYYMMDD' 또는 null
            Pageable pageable
    );
}