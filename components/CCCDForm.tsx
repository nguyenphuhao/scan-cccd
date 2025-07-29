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
        CCCD Information
      </h2>

      {/* Card Number */}
      <div>
        <label className="form-label">
          Card Number (Số CCCD)
        </label>
        <input
          type="text"
          value={data.cardNumber}
          onChange={handleChange('cardNumber')}
          disabled={!isEditing}
          className="form-field"
          placeholder="Enter card number"
        />
      </div>

      {/* Full Name */}
      <div>
        <label className="form-label">
          Full Name (Họ và tên)
        </label>
        <input
          type="text"
          value={data.fullName}
          onChange={handleChange('fullName')}
          disabled={!isEditing}
          className="form-field"
          placeholder="Enter full name"
        />
      </div>

      {/* Date of Birth */}
      <div>
        <label className="form-label">
          Date of Birth (Ngày sinh)
        </label>
        <input
          type="text"
          value={data.dateOfBirth}
          onChange={handleChange('dateOfBirth')}
          disabled={!isEditing}
          className="form-field"
          placeholder="DD/MM/YYYY"
        />
      </div>

      {/* Sex */}
      <div>
        <label className="form-label">
          Sex (Giới tính)
        </label>
        <input
          type="text"
          value={data.sex}
          onChange={handleChange('sex')}
          disabled={!isEditing}
          className="form-field"
          placeholder="Nam/Nữ"
        />
      </div>

      {/* Nationality */}
      <div>
        <label className="form-label">
          Nationality (Quốc tịch)
        </label>
        <input
          type="text"
          value={data.nationality}
          onChange={handleChange('nationality')}
          disabled={!isEditing}
          className="form-field"
          placeholder="Việt Nam"
        />
      </div>

      {/* Place of Origin */}
      <div>
        <label className="form-label">
          Place of Origin (Quê quán)
        </label>
        <textarea
          value={data.placeOfOrigin}
          onChange={handleChange('placeOfOrigin')}
          disabled={!isEditing}
          className="form-field min-h-[60px] resize-none"
          placeholder="Enter place of origin"
          rows={2}
        />
      </div>

      {/* Place of Residence */}
      <div>
        <label className="form-label">
          Place of Residence (Nơi thường trú)
        </label>
        <textarea
          value={data.placeOfResidence}
          onChange={handleChange('placeOfResidence')}
          disabled={!isEditing}
          className="form-field min-h-[60px] resize-none"
          placeholder="Enter place of residence"
          rows={2}
        />
      </div>

      {/* Date of Expiry */}
      <div>
        <label className="form-label">
          Date of Expiry (Có giá trị đến)
        </label>
        <input
          type="text"
          value={data.dateOfExpiry}
          onChange={handleChange('dateOfExpiry')}
          disabled={!isEditing}
          className="form-field"
          placeholder="DD/MM/YYYY"
        />
      </div>

      {/* Additional fields for back side */}
      {data.personalIdentification && (
        <div>
          <label className="form-label">
            Personal Identification (Đặc điểm nhân dạng)
          </label>
          <input
            type="text"
            value={data.personalIdentification}
            onChange={handleChange('personalIdentification')}
            disabled={!isEditing}
            className="form-field"
            placeholder="Personal identification marks"
          />
        </div>
      )}

      {data.dateOfIssue && (
        <div>
          <label className="form-label">
            Date of Issue (Ngày cấp)
          </label>
          <input
            type="text"
            value={data.dateOfIssue}
            onChange={handleChange('dateOfIssue')}
            disabled={!isEditing}
            className="form-field"
            placeholder="DD/MM/YYYY"
          />
        </div>
      )}

      {data.issuingAuthority && (
        <div>
          <label className="form-label">
            Issuing Authority (Cơ quan cấp)
          </label>
          <input
            type="text"
            value={data.issuingAuthority}
            onChange={handleChange('issuingAuthority')}
            disabled={!isEditing}
            className="form-field"
            placeholder="Issuing authority"
          />
        </div>
      )}
    </div>
  );
} 