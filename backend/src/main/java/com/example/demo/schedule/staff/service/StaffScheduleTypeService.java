package com.example.demo.schedule.staff.service;

import com.example.demo.schedule.staff.dto.StaffScheduleTypeDto;
import com.example.demo.schedule.staff.entity.StaffScheduleType;
import com.example.demo.schedule.staff.repository.StaffScheduleTypeRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class StaffScheduleTypeService {
    private final StaffScheduleTypeRepository staffScheduleTypeRepository;

    //근무유형등록
    public Integer register(StaffScheduleTypeDto dto){
        if(staffScheduleTypeRepository.existsByTypeCode(dto.getTypeCode())){
            throw  new IllegalStateException("이미 존재하는 근무유형 코드입니다");
        }
        StaffScheduleType staffScheduleType=dtoToEntity(dto);

        return staffScheduleTypeRepository.save(staffScheduleType).getScheduleTypeId();
    }

    //전체조회
    public List<StaffScheduleTypeDto> selectAll(){
        List<StaffScheduleType> result=staffScheduleTypeRepository.findAll();

        return result.stream()
                .map(this::entityToDto)
                .toList();
    }

    //조회
    public StaffScheduleTypeDto selectOne(Integer scheduleTypdId){
        StaffScheduleType staffScheduleType=staffScheduleTypeRepository.findById(scheduleTypdId)
                .orElseThrow(()->new EntityNotFoundException("근무유형이 존재하지 않습니다"));
        return entityToDto(staffScheduleType);
    }

    //삭제
    public void delete(Integer scheduleTypeId){
        StaffScheduleType staffScheduleType=staffScheduleTypeRepository.findById(scheduleTypeId)
                .orElseThrow(()->new EntityNotFoundException("근무유형이 존재하지 않습니다"));
        staffScheduleTypeRepository.delete(staffScheduleType);
    }

    //수정
    public StaffScheduleTypeDto update(Integer scheduleTypdId, StaffScheduleTypeDto dto){
        StaffScheduleType staffScheduleType= staffScheduleTypeRepository.findById(scheduleTypdId)
                .orElseThrow(()->new EntityNotFoundException("근무유형이 존재하지 않습니다"));
        if(!staffScheduleType.getTypeCode().equals(dto.getTypeCode()) &&
        staffScheduleTypeRepository.existsByTypeCode(dto.getTypeCode())){
            throw new IllegalStateException("이미 존재하는 근무유형 코드입니다");
        }
        staffScheduleType.setTypeCode(dto.getTypeCode());
        staffScheduleType.setTypeName(dto.getTypeName());
        staffScheduleType.setStartTime(dto.getStartTime());
        staffScheduleType.setEndTime(dto.getEndTime());
        staffScheduleType.setIsActive(dto.getIsActive() !=null? dto.getIsActive():true);

        return entityToDto(staffScheduleType);
    }

    private StaffScheduleType dtoToEntity(StaffScheduleTypeDto dto){
        return StaffScheduleType.builder()
                .typeCode(dto.getTypeCode())
                .typeName(dto.getTypeName())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .build();
    }
    private StaffScheduleTypeDto entityToDto(StaffScheduleType entity){
        return StaffScheduleTypeDto.builder()
                .scheduleTypeId(entity.getScheduleTypeId())
                .typeCode(entity.getTypeCode())
                .typeName(entity.getTypeName())
                .startTime(entity.getStartTime())
                .endTime(entity.getEndTime())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .build();
    }


}
