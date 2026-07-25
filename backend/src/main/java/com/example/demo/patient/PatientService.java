package com.example.demo.patient;

import com.example.demo.patient.dto.*;
import com.example.demo.payment.PaymentRepository;
import com.example.demo.reception.Reception;
import com.example.demo.reception.ReceptionRepository;
import com.example.demo.reception.ReceptionStatus;
import com.example.demo.reservation.Reservation;
import com.example.demo.reservation.ReservationRepository;
import com.example.demo.reservation.ReservationStatus;
import com.example.demo.slot.Slot;
import com.example.demo.slot.SlotRepository;
import com.example.demo.socialAccount.SocialAccount;
import com.example.demo.socialAccount.SocialAccountProvider;
import com.example.demo.socialAccount.SocialAccountRepository;
import com.example.demo.user.User;
import com.example.demo.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PatientService {
    private final ReservationRepository reservationRepository;
    private final ReceptionRepository receptionRepository;
    private final PaymentRepository paymentRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final SocialAccountRepository socialAccountRepository;
    private final PasswordEncoder passwordEncoder;

    public void removeMySocialAccount(Integer userId, String provider){
        User user=userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 사용자입니다."));

        List<SocialAccount> accounts=socialAccountRepository.findByUser(user);
        if (accounts == null || accounts.isEmpty() || accounts.size() == 0){
            throw new RuntimeException("소셜 로그인 계정이 존재하지 않습니다.");
        }

        if (provider.equals("NAVER")){
            SocialAccount account=socialAccountRepository.findByUserAndProvider(user, SocialAccountProvider.NAVER)
                    .orElseThrow(() -> new RuntimeException("네이버 소셜 로그인 계정이 존재하지 않습니다."));

            socialAccountRepository.deleteByUserAndProvider(user, account.getProvider());
        } else if (provider.equals("KAKAO")) {
            SocialAccount account=socialAccountRepository.findByUserAndProvider(user, SocialAccountProvider.KAKAO)
                    .orElseThrow(() -> new RuntimeException("카카오 소셜 로그인 계정이 존재하지 않습니다."));

            socialAccountRepository.deleteByUserAndProvider(user, account.getProvider());
        }
    }

    public String checkMyPassword(Integer userId, String password){
        User user=userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 사용자입니다."));

        if (!passwordEncoder.matches(password.trim(), user.getPassword())){
            return "false";
        }

        return "true";
    }

    public InformationUpdateDto updateMyInformation(Integer userId, InformationUpdateDto dto){
        User user=userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 사용자입니다."));

        if (dto.getKey().equals("email")){
            user.setEmail(dto.getValue().trim());

            return InformationUpdateDto.builder()
                    .key(dto.getKey())
                    .key(user.getEmail())
                    .build();
        }

        if (dto.getKey().equals("password")){
            String encodedPwd=passwordEncoder.encode(dto.getValue().trim());
            user.setPassword(encodedPwd);

            return InformationUpdateDto.builder()
                    .key(dto.getKey())
                    .build();
        }

        Patient patient=patientRepository.findByUser_UserId(user.getUserId())
                .orElseThrow(() -> new RuntimeException("환자 정보가 존재하지 않습니다."));

        InformationUpdateDto response=new InformationUpdateDto();

        switch (dto.getKey()){
            case "name":
                patient.setName(dto.getValue().trim());
                response.setKey(dto.getKey());
                response.setValue(patient.getName());
                break;

            case "phone":
                patient.setPhone(dto.getValue().trim());
                response.setKey(dto.getKey());
                response.setValue(patient.getPhone());
                break;

            case "address":
                patient.setAddress(dto.getValue().trim());
                response.setKey(dto.getKey());
                response.setValue(patient.getAddress());
        }

        return response;
    }

    public ReservationCancelDto cancelReservation(Integer userId, ReservationCancelDto dto){
        User user=userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 사용자입니다."));

        Patient patient=patientRepository.findByUser_UserId(user.getUserId())
                .orElseThrow(() -> new RuntimeException("환자 정보가 존재하지 않습니다."));

        Reservation reservation=reservationRepository.findByReservationId(dto.getReservationId())
                .orElseThrow(() -> new RuntimeException("예약이 존재하지 않습니다."));

        if (!patient.getPatientId().equals(reservation.getPatient().getPatientId())){
            throw new RuntimeException("환자 정보가 일치하지 않아 예약을 취소할 수 없습니다.");
        }

        if (!ReservationStatus.RECEIVED.equals(reservation.getStatus()) && !ReservationStatus.PENDING.equals(reservation.getStatus())){
            throw new RuntimeException("취소할 수 없는 상태의 예약입니다.");
        }

        if (reservation.getStatus().equals(ReservationStatus.PENDING)){
            if (reservation.getSlot() != null){
                Slot slot=reservation.getSlot();

                Integer currentPatient=slot.getCurrentPatient();
                if (currentPatient > 0){
                    slot.setCurrentPatient(currentPatient - 1);
                }
            }
        }

        reservation.setStatus(ReservationStatus.CANCELED);

        return ReservationCancelDto.builder()
                .reservationId(reservation.getReservationId())
                .status(reservation.getStatus().name())
                .build();
    }

    public MyInfoResponse getMyInformation(Integer userId){
        User user=userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 사용자입니다."));

        Patient patient=patientRepository.findByUser_UserId(user.getUserId())
                .orElseThrow(() -> new RuntimeException("환자 정보가 존재하지 않습니다."));

        MyInfoResponse response=MyInfoResponse.builder()
                .userId(user.getUserId())
                .patientId(patient.getPatientId())
                .name(patient.getName())
                .rrn(patient.getRrn())
                .phone(patient.getPhone() != null ? patient.getPhone() : null)
                .address(patient.getAddress() != null ? patient.getAddress() : null)
                .build();

        List<SocialAccount> accounts=socialAccountRepository.findByUser(user);

        if (accounts == null || accounts.isEmpty()){ //소셜 로그인 정보 없음
            response.setEmail(user.getEmail());
            response.setLocal(true);
        } else {
            if (user.getEmail().startsWith("SOCIAL_")){ //소셜 로그인으로 회원가입
                List<MySocialAccount> socialAccounts=accounts.stream().map(s -> MySocialAccount.builder()
                        .socialAccountId(s.getSocialAccountId())
                        .provider(s.getProvider().name())
                        .createdAt(s.getCreatedAt())
                        .build()).toList();
                response.setSocialAccounts(socialAccounts);
                response.setOnlySocial(true);
            } else { //일반 회원가입 후 소셜 로그인 연결(소셜 로그인으로만 로그인 가능)
                List<MySocialAccount> socialAccounts=accounts.stream().map(s -> MySocialAccount.builder()
                        .socialAccountId(s.getSocialAccountId())
                        .provider(s.getProvider().name())
                        .createdAt(s.getCreatedAt())
                        .build()).toList();
                response.setSocialAccounts(socialAccounts);
                response.setEmail(user.getEmail());
                response.setHasSocial(true);
            }
        }

        return response;
    }

    public Page<MyReservationResponse> getMyReservations(Integer userId, String status, Pageable pageable){
        User user=userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 사용자입니다."));

        Patient patient=patientRepository.findByUser_UserId(user.getUserId())
                .orElseThrow(() -> new RuntimeException("환자 정보가 존재하지 않습니다."));

        ReservationStatus reservationStatus = (status == null || status.isBlank()) ? null : switch (status) {
            case "RECEIVED"  -> ReservationStatus.RECEIVED;
            case "PENDING"   -> ReservationStatus.PENDING;
            case "CONFIRMED" -> ReservationStatus.CONFIRMED;
            case "COMPLETED" -> ReservationStatus.COMPLETED;
            case "CANCELED"  -> ReservationStatus.CANCELED;
            default          -> null;
        };

        return getFormattedReservations(patient, reservationStatus, pageable);
    }

    private Page<MyReservationResponse> getFormattedReservations(Patient patient, ReservationStatus status, Pageable pageable){
        return reservationRepository.findMyReservations(patient, status, pageable).map(r -> MyReservationResponse.builder()
                .reservationId(r.getReservationId())
                .doctorId(r.getStaff().getStaffId())
                .doctorName(r.getStaff().getName())
                .departmentId(r.getDepartment().getDepartmentId())
                .departmentName(r.getDepartment().getDepartmentName())
                .symptom(r.getSymptom())
                .status(r.getStatus().name())
                .createdAt(r.getCreatedAt())
                .build());
    }

    public Page<MyReceptionResponse> getMyReceptions(Integer userId, Pageable pageable, String sort){
        User user=userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 사용자입니다."));

        Patient patient=patientRepository.findByUser_UserId(user.getUserId())
                .orElseThrow(() -> new RuntimeException("환자 정보가 존재하지 않습니다."));

        Page<Reception> receptions;
        if ("DESC".equals(sort)){
            receptions=receptionRepository.findMyReceptionRecordsDesc(patient, ReceptionStatus.COMPLETED, pageable);
        } else {
            receptions=receptionRepository.findMyReceptionRecordsAsc(patient, ReceptionStatus.COMPLETED, pageable);
        }

        return receptions.map(r -> MyReceptionResponse.builder()
                        .receptionId(r.getReceptionId())
                        .doctorId(r.getReservation().getStaff().getStaffId())
                        .doctorName(r.getReservation().getStaff().getName())
                        .departmentId(r.getReservation().getDepartment().getDepartmentId())
                        .departmentName(r.getReservation().getDepartment().getDepartmentName())
                        .status(r.getStatus().name())
                        .symptom(r.getReservation().getSymptom())
                        .treatedAt(r.getReservation().getSlot().getStartTime())
                        .build());
    }
    public Page<MyPaymentResponse> getMyPaymentList(Integer userId, Integer receptionId, Pageable pageable){
        User user=userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 사용자입니다."));

        Patient patient=patientRepository.findByUser_UserId(user.getUserId())
                .orElseThrow(() -> new RuntimeException("환자 정보가 존재하지 않습니다."));

        Reception reception=receptionRepository.findByReceptionId(receptionId)
                .orElseThrow(() -> new RuntimeException("접수 정보가 존재하지 않습니다."));

        if (!patient.getPatientId().equals(reception.getReservation().getPatient().getPatientId())){
            throw new RuntimeException("환자 정보가 일치하지 않아 결제 내역에 접근할 수 없습니다.");
        }

        return paymentRepository.findByBilling_Reception(reception, pageable)
                .map(p -> MyPaymentResponse.builder()
                        .billingId(p.getBilling().getBillingId())
                        .paymentId(p.getPaymentId())
                        .amount(p.getAmount())
                        .method(p.getMethod().name())
                        .paidAt(p.getPaymentDatetime())
                        .build());
    }
}
