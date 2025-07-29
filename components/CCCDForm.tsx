'use client';

import React from 'react';
import { CCCDData } from '@/types/cccd';

interface CCCDFormProps {
  data: CCCDData;
  onChange: (field: keyof CCCDData, value: string) => void;
  isEditing?: boolean;
}

export default function CCCDForm({ data, onChange, isEditing = false }: CCCDFormProps) {
  const handleChange = (field: keyof CCCDData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(field, e.target.value);
  };

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        Thông tin CCCD
      </h2>

      {/* Card Number */}
      <div>
        <label className="form-label">
          Số CCCD
        </label>
        <input
          type="text"
          value={data.cardNumber}
          onChange={handleChange('cardNumber')}
          disabled={!isEditing}
          className="form-field text-black"
          placeholder="Nhập số CCCD"
        />
      </div>

      {/* Full Name */}
      <div>
        <label className="form-label">
          Họ và tên
        </label>
        <input
          type="text"
          value={data.fullName}
          onChange={handleChange('fullName')}
          disabled={!isEditing}
          className="form-field text-black"
          placeholder="Nhập họ và tên"
        />
      </div>

      {/* Date of Birth */}
      <div>
        <label className="form-label">
          Ngày sinh
        </label>
        <input
          type="text"
          value={data.dateOfBirth}
          onChange={handleChange('dateOfBirth')}
          disabled={!isEditing}
          className="form-field text-black"
          placeholder="DD/MM/YYYY"
        />
      </div>

      {/* Sex */}
      <div>
        <label className="form-label">
          Giới tính
        </label>
        <input
          type="text"
          value={data.sex}
          onChange={handleChange('sex')}
          disabled={!isEditing}
          className="form-field text-black"
          placeholder="Nam/Nữ"
        />
      </div>

      {/* Nationality */}
      <div>
        <label className="form-label">
          Quốc tịch
        </label>
        <input
          type="text"
          value={data.nationality}
          onChange={handleChange('nationality')}
          disabled={!isEditing}
          className="form-field text-black"
          placeholder="Việt Nam"
        />
      </div>

      {/* Place of Origin */}
      <div>
        <label className="form-label">
          Quê quán
        </label>
        <textarea
          value={data.placeOfOrigin}
          onChange={handleChange('placeOfOrigin')}
          disabled={!isEditing}
          className="form-field min-h-[60px] resize-none text-black"
          placeholder="Nhập quê quán"
          rows={2}
        />
      </div>

      {/* Place of Residence */}
      <div>
        <label className="form-label">
          Nơi thường trú
        </label>
        <textarea
          value={data.placeOfResidence}
          onChange={handleChange('placeOfResidence')}
          disabled={!isEditing}
          className="form-field min-h-[60px] resize-none text-black"
          placeholder="Nhập nơi thường trú"
          rows={2}
        />
      </div>

      {/* Date of Expiry */}
      <div>
        <label className="form-label">
          Có giá trị đến
        </label>
        <input
          type="text"
          value={data.dateOfExpiry}
          onChange={handleChange('dateOfExpiry')}
          disabled={!isEditing}
          className="form-field text-black"
          placeholder="DD/MM/YYYY"
        />
      </div>

      {/* Additional fields for back side */}
      {data.personalIdentification && (
        <div>
          <label className="form-label">
            Đặc điểm nhân dạng
          </label>
          <input
            type="text"
            value={data.personalIdentification}
            onChange={handleChange('personalIdentification')}
            disabled={!isEditing}
            className="form-field text-black"
            placeholder="Đặc điểm nhân dạng"
          />
        </div>
      )}

      {data.dateOfIssue && (
        <div>
          <label className="form-label">
            Ngày cấp
          </label>
          <input
            type="text"
            value={data.dateOfIssue}
            onChange={handleChange('dateOfIssue')}
            disabled={!isEditing}
            className="form-field text-black"
            placeholder="DD/MM/YYYY"
          />
        </div>
      )}

      {data.issuingAuthority && (
        <div>
          <label className="form-label">
            Cơ quan cấp
          </label>
          <input
            type="text"
            value={data.issuingAuthority}
            onChange={handleChange('issuingAuthority')}
            disabled={!isEditing}
            className="form-field text-black"
            placeholder="Cơ quan cấp"
          />
        </div>
      )}
    </div>
  );
} 