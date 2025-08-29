package com.example.dicomproject.dicomrepo.dto;

public interface StudyProjection {
    long getStudyKey();
    String getStudyUid();
    String getStudyDate();
    String getStudyTime();
    String getStudyDesc();
    String getModality();
    String getBodyPart();
    String getAccessionNum();
    String getPid();
    String getPname();
}