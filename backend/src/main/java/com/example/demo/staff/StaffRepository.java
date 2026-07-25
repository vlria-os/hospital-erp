package com.example.demo.staff;

import com.example.demo.department.Department;
import com.example.demo.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StaffRepository extends JpaRepository<Staff,Integer> {
    @Query("""
        SELECT s FROM UserRole ur
        JOIN ur.role r
        JOIN ur.user u
        JOIN Staff s ON s.user = u
        WHERE s.department = :dept
        AND r.roleName = 'DOCTOR'
        AND u.status = 'Y'
       ORDER BY r.roleName
    """)
    Optional<List<Staff>> findDoctorsByDepartment(Department dept);

    @Query("""
        select s
        from Staff s
        join s.user u
        join u.userRoles ur
        join ur.role r
        where s.department = :department
            and r.roleName = 'DOCTOR'
            and u.status = 'Y'
            and s.isActive = 'Y'
        order by s.staffId asc 
    """)
    List<Staff> findDoctorByDepartment(@Param("department") Department department);

    Optional<Staff> findByDepartmentAndName(Department department, String name);

    List<Staff> findAllByDepartment(Department Department);

    Staff findByStaffId(Integer staffId);
    List<Staff> findByUserIn(List<User> users);
    Optional<Staff> findByUser(User user);
    Optional<Staff> findByUser_UserId(Integer userId);

    List<Staff> findByUserNotIn(List<User> users);

    @Query("""
        select distinct s
        from Staff s
        join s.user u
        join s.department d
        join UserRole ur on ur.user = u
        join ur.role r
        where u.userId != :userId
            and s.isActive = 'Y'
            and u.status = 'Y'
            and (
                    :keyword is null or
                        lower(s.name) like lower(concat('%', :keyword, '%')) or
                        lower(d.departmentName) like lower(concat('%', :keyword, '%')) or
                        lower(r.roleName) like lower(concat('%', :keyword, '%'))
                )
    """)
    List<Staff> searchStaff(@Param("userId") Integer userId, @Param("keyword") String keyword);
    List<Staff> findByDepartmentDepartmentId(Integer departmentId);

    @Query("""
        select distinct s from Staff s
        join s.user u
        join UserRole ur on ur.user = u
        join ur.role r
        where r.roleId = :roleId
            and s.isActive = 'Y'
            and u.status = 'Y'
    """)
    List<Staff> findByRoleId(@Param("roleId") Integer roleId);

    @Query("""
        select distinct s from Staff s
        join s.user u
        left join s.department d
        left join UserRole ur on ur.user = u
        left join ur.role r
        where (:keyword is null
            or lower(s.name) like lower(concat('%', :keyword, '%'))
            or lower(d.departmentName) like lower(concat('%', :keyword, '%'))
            or lower(r.roleName) like lower(concat('%', :keyword, '%'))
        )
    """)
    Page<Staff> findAllWithKeyword(@Param("keyword") String keyword, Pageable pageable);
}
