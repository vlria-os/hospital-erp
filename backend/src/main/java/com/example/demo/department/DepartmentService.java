package com.example.demo.department;

import com.example.demo.role.RoleRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional
public class DepartmentService {
    private final DepartmentRepository departmentRepository;
    private final RoleRepository roleRepository;

    public Map<String, Object> getDepartment() {
        List<DepartmentDto> list = departmentRepository.findAll()
                .stream()
                .map(dept -> DepartmentDto.builder()
                        .departmentId(dept.getDepartmentId())
                        .departmentName(dept.getDepartmentName())
                        .build())
                .toList();

        return Map.of("content", list);
    }

    //등록
    public Integer register(DepartmentDto dto){
        if (departmentRepository.existsByDepartmentName(dto.getDepartmentName())) {
            throw new IllegalArgumentException("이미 존재하는 부서입니다");
        }
        Department department=dtoToEntity(dto);

        return departmentRepository.save(department).getDepartmentId();
    }

    private Department dtoToEntity(DepartmentDto dto){
        return Department.builder()
                .departmentName(dto.getDepartmentName())
                .location(dto.getLocation())
                .status(dto.getStatus())
                .build();
    }

    //전체조회
    public List<DepartmentDto> selectAll(){
        List<Department> result=departmentRepository.findAll();

        return result.stream()
                .map(this::entityToDto)
                .toList();
    }

    private DepartmentDto entityToDto(Department entity){
        return DepartmentDto.builder()
                .departmentId(entity.getDepartmentId())
                .departmentName(entity.getDepartmentName())
                .location(entity.getLocation())
                .status(entity.getStatus())
                .build();
    }
    //조회
    public DepartmentDto selectOne(Integer departmentId){
        Department department=departmentRepository.findById(departmentId)
                .orElseThrow(()-> new EntityNotFoundException("해당 부서가 존재하지 않습니다"));
        return entityToDto(department);
    }

    //삭제
    public void delete(Integer departmentId){
        Department department=departmentRepository.findById(departmentId)
                .orElseThrow(()->new EntityNotFoundException("해당 부서가 존재하지 않습니다"));
        departmentRepository.delete(department);
    }

    //수정
    public DepartmentDto update(Integer departmentId, DepartmentDto dto){
        Department department=departmentRepository.findById(departmentId)
                .orElseThrow(()->new EntityNotFoundException("해당 부서가 존재하지 않습니다"));
        if (!department.getDepartmentName().equals(dto.getDepartmentName())&&
        departmentRepository.existsByDepartmentName(dto.getDepartmentName())){
            throw new IllegalStateException("이미 존재하는 부서입니다");
        }
        department.setDepartmentName(dto.getDepartmentName());
        department.setLocation(dto.getLocation());
        department.setStatus(dto.getStatus());

        return entityToDto(department);
    }
}
